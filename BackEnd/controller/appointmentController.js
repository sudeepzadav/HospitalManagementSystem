const Appointment = require("../model/appointmentSchema");
const Doctor = require("../model/doctorSchema");
const Patient = require("../model/patientSchema");
const errorHandler = require("../utils/errorHandler");

const DAILY_CAP_PER_DOCTOR = 20;

function startOfDay(dateInput) {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(dateInput) {
  const d = new Date(dateInput);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ======================
// Symptom -> Department keyword map (used by matchDepartmentRoute, optional
// server-side matching endpoint — the chatbot may instead do this client-side)
// ======================
const DEPARTMENT_KEYWORDS = {
  Cardiology: ["chest", "heart", "palpitation", "bp", "blood pressure"],
  Pediatrics: ["child", "baby", "infant", "toddler"],
  Orthopedics: ["bone", "joint", "fracture", "back pain", "knee", "shoulder", "sprain"],
  Neurology: ["headache", "migraine", "seizure", "dizzy", "dizziness", "numbness"],
  Ophthalmology: ["eye", "vision", "blurry"],
  Immunology: ["allergy", "allergies", "allergic", "hives", "vaccine", "vaccination", "immune"],
  "Emergency & Trauma": ["emergency", "accident", "trauma", "unconscious", "severe bleeding", "severe injury"],
  "General Medicine": [
    "fever", "cold", "cough", "fatigue", "flu",
    "stomach", "abdomen", "abdominal", "nausea", "vomit", "diarrhea",
    "skin", "rash", "itch", "itchy", "acne", "eczema",
    "throat", "sore throat", "ear", "sinus",
  ],
};

function matchDepartment(problemText, availableDepartments = []) {
  if (!problemText) return null;
  const text = problemText.toLowerCase();
  const availableSet = new Set(availableDepartments.map((d) => d.toLowerCase()));

  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    if (!availableSet.has(dept.toLowerCase())) continue; // only suggest depts that exist in DB
    if (keywords.some((kw) => text.includes(kw))) {
      return availableDepartments.find((d) => d.toLowerCase() === dept.toLowerCase());
    }
  }
  return null;
}

// ======================
// Helper: does this doctor work on the given date's weekday?
// ======================
const WEEKDAY_ALIASES = {
  sunday: ["sunday", "sun", "0"],
  monday: ["monday", "mon", "1"],
  tuesday: ["tuesday", "tue", "tues", "2"],
  wednesday: ["wednesday", "wed", "3"],
  thursday: ["thursday", "thu", "thur", "thurs", "4"],
  friday: ["friday", "fri", "5"],
  saturday: ["saturday", "sat", "6"],
};

function isDoctorAvailableOnDate(doctor, dateObj) {
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" }); // e.g. "Monday"
  const dayNameLower = dayName.toLowerCase();
  const aliases = WEEKDAY_ALIASES[dayNameLower] || [dayNameLower];

  if (!Array.isArray(doctor.availability) || doctor.availability.length === 0) {
    console.error(
      `[availability] Doctor ${doctor._id} has no/invalid availability array:`,
      doctor.availability
    );
    return false;
  }

  const match = doctor.availability.some((a) => {
    const rawValue = a && (a.day ?? a.dayOfWeek ?? a.weekday);
    if (rawValue === undefined || rawValue === null) return false;
    const normalized = String(rawValue).trim().toLowerCase();
    return aliases.includes(normalized);
  });

  if (!match) {
    console.error(
      `[availability] No match for ${dayName} (doctor ${doctor._id}). ` +
        `Raw availability entries:`,
      JSON.stringify(doctor.availability)
    );
  }

  return match;
}

// ======================
// Helper: are patientDetails actually complete?
// ======================
function hasCompletePatientDetails(patientDetails) {
  if (!patientDetails) return false;
  const { name, age, gender } = patientDetails;
  const ageIsValid = age !== undefined && age !== null && age !== "";
  return Boolean(name) && ageIsValid && Boolean(gender);
}

// ======================
// Helper: how many active appointments a doctor has on a given date,
// plus whether the doctor even works that weekday at all.
// ======================
async function getQueueStatusForDoctor(doctorId, dateString) {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return { error: "Doctor not found" };

  const dateObj = startOfDay(dateString);

  if (!isDoctorAvailableOnDate(doctor, dateObj)) {
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    return {
      dayAvailable: false,
      full: true,
      message: `This doctor is not available on ${dayName}s.`,
      capacity: DAILY_CAP_PER_DOCTOR,
      bookedCount: 0,
      nextToken: 1,
    };
  }

  const bookedCount = await Appointment.countDocuments({
    doctorId,
    date: { $gte: startOfDay(dateString), $lte: endOfDay(dateString) },
    status: { $in: ["pending", "confirmed"] },
  });

  return {
    dayAvailable: true,
    capacity: DAILY_CAP_PER_DOCTOR,
    bookedCount,
    available: Math.max(DAILY_CAP_PER_DOCTOR - bookedCount, 0),
    nextToken: bookedCount + 1,
    full: bookedCount >= DAILY_CAP_PER_DOCTOR,
  };
}

// ======================
// Helper: find-or-create a Patient record for a given User ID
// ======================
async function getOrCreatePatientForUser(userId) {
  let patient = await Patient.findOne({ userId });
  if (!patient) {
    patient = await Patient.create({ userId });
  }
  return patient;
}

// ======================
// Core booking logic
// ======================
async function bookAppointment(
  { userId, patientId, doctorId, department, date, reason, bookedVia, patientDetails },
  attempt = 0
) {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    console.error(`[bookAppointment] Doctor not found for doctorId=${doctorId}`);
    return { success: false, message: "Doctor not found" };
  }

  if (!hasCompletePatientDetails(patientDetails)) {
    console.error(`[bookAppointment] Incomplete patientDetails:`, JSON.stringify(patientDetails));
    return { success: false, message: "Patient name, age, and gender are required" };
  }

  const dateObj = startOfDay(date);

  if (!isDoctorAvailableOnDate(doctor, dateObj)) {
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    console.error(
      `[bookAppointment] Doctor ${doctorId} not available on ${dayName}. ` +
        `doctor.availability=${JSON.stringify(doctor.availability)}`
    );
    return { success: false, message: `Doctor is not available on ${dayName}s` };
  }

  const resolvedPatientId =
    patientId || (userId ? (await getOrCreatePatientForUser(userId))._id : null);
  if (!resolvedPatientId) {
    console.error(`[bookAppointment] Could not resolve patient. patientId=${patientId} userId=${userId}`);
    return { success: false, message: "Patient could not be resolved" };
  }

  const bookedCount = await Appointment.countDocuments({
    doctorId,
    date: { $gte: startOfDay(date), $lte: endOfDay(date) },
    status: { $in: ["pending", "confirmed"] },
  });

  if (bookedCount >= DAILY_CAP_PER_DOCTOR) {
    console.error(
      `[bookAppointment] Doctor ${doctorId} fully booked for ${date}: ${bookedCount}/${DAILY_CAP_PER_DOCTOR}`
    );
    return {
      success: false,
      message: `This doctor is fully booked for that day (${DAILY_CAP_PER_DOCTOR}/${DAILY_CAP_PER_DOCTOR}). Please choose another date.`,
      full: true,
    };
  }

  const tokenNumber = bookedCount + 1;

  try {
    const appointment = await Appointment.create({
      patientId: resolvedPatientId,
      doctorId,
      department: department || doctor.department,
      patientDetails,
      date: dateObj,
      tokenNumber,
      reason,
      status: "pending",
      bookedVia: bookedVia || "dashboard",
      consultationFee: doctor.consultationFee,
    });

    return { success: true, appointment };
  } catch (error) {
    console.error(
      `[bookAppointment] Appointment.create failed: ${error.message}. ` +
        `Payload=${JSON.stringify({
          patientId: resolvedPatientId,
          doctorId,
          department: department || doctor.department,
          date: dateObj,
          tokenNumber,
        })}`
    );
    if (error.code === 11000 && attempt < 2) {
      return bookAppointment(
        { userId, patientId, doctorId, department, date, reason, bookedVia, patientDetails },
        attempt + 1
      );
    }
    if (error.code === 11000) {
      return { success: false, message: "Please try booking again — that slot was just taken." };
    }
    return { success: false, message: error.message };
  }
}

// ======================
// Route: Create Appointment (dashboard / receptionist use)
// ======================
const createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, department, date, reason, patientDetails } = req.body;

    if (!patientId || !doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "patientId, doctorId, and date are required",
      });
    }

    const result = await bookAppointment({
      patientId,
      doctorId,
      department,
      date,
      reason,
      patientDetails,
      bookedVia: "dashboard",
    });

    if (!result.success) {
      return res.status(409).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    return errorHandler(res, error);
  }
};

// ======================
// Route: Self-book (patient books for themselves or a family member, via chatbot)
// ======================
const selfBookAppointment = async (req, res) => {
  try {
    const { doctorId, department, date, reason, patientDetails } = req.body;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "doctorId and date are required",
      });
    }

    const result = await bookAppointment({
      userId: req.user.id,
      doctorId,
      department,
      date,
      reason,
      patientDetails,
      bookedVia: "chatbot",
    });

    if (!result.success) {
      return res.status(409).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    return errorHandler(res, error);
  }
};

// ======================
// Route: Get Appointments (with optional filters)
// ======================
const getAppointments = async (req, res) => {
  try {
    const { doctorId, patientId, status, date } = req.query;
    const filter = {};

    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;
    if (date) {
      filter.date = { $gte: startOfDay(date), $lte: endOfDay(date) };
    }

    const appointments = await Appointment.find(filter)
      .populate({ path: "patientId", populate: { path: "userId", select: "name email phone" } })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email phone" } })
      .sort({ date: 1, tokenNumber: 1 });

    res.status(200).json({ success: true, appointments });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// ======================
// Route: Get Appointment By ID
// ======================
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: "patientId", populate: { path: "userId", select: "name email phone" } })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email phone" } });

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.status(200).json({ success: true, appointment });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// ======================
// Route: Update Appointment Status
// ======================
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    const allowed = ["pending", "confirmed", "completed", "cancelled", "no_show"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updateData = { status };
    if (status === "cancelled" && cancellationReason) {
      updateData.cancellationReason = cancellationReason;
    }

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.status(200).json({ success: true, appointment });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// ======================
// Route: Delete Appointment
// ======================
const deleteAppointment = async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    res.status(200).json({ success: true, message: "Appointment deleted" });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// ======================
// Route: Get Queue Status for a Doctor on a Date
// ======================
const getQueueStatus = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: "doctorId and date are required" });
    }

    const result = await getQueueStatusForDoctor(doctorId, date);

    if (result.error) {
      return res.status(404).json({ success: false, message: result.error });
    }

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// ======================
// Route: Match a free-text problem description to a real department
// ======================
const matchDepartmentRoute = async (req, res) => {
  try {
    const { problem } = req.body;
    const departments = await Doctor.distinct("department");
    const matched = matchDepartment(problem, departments);

    res.status(200).json({
      success: true,
      matchedDepartment: matched,
      departments,
    });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// ======================
// Route: Get the logged-in user's own appointments (patient dashboard)
// ======================
const getMyAppointments = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    // Every Patient profile tied to this account, not just one.
    const myPatientIds = await Patient.find({ userId }).distinct("_id");

    if (myPatientIds.length === 0) {
      // No patient record yet means they've never booked — not an error
      return res.status(200).json({ success: true, upcoming: [], past: [] });
    }

    const appointments = await Appointment.find({ patientId: { $in: myPatientIds } })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name email phone" } })
      .sort({ date: -1, tokenNumber: 1 });

    const today = startOfDay(new Date());
    const upcoming = [];
    const past = [];

    for (const appt of appointments) {
      const isUpcoming =
        appt.date >= today && ["pending", "confirmed"].includes(appt.status);
      (isUpcoming ? upcoming : past).push(appt);
    }

    // Upcoming soonest-first, past most-recent-first
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    past.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ success: true, upcoming, past });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// ======================
// Route: Get the logged-in DOCTOR's own schedule (doctor dashboard).
// ======================
const getMyDoctorSchedule = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "No doctor profile is linked to this account.",
      });
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate({ path: "patientId", populate: { path: "userId", select: "name email phone" } })
      .sort({ date: -1, tokenNumber: 1 });

    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayList = [];
    const upcoming = [];
    const past = [];

    for (const appt of appointments) {
      const apptDay = startOfDay(appt.date);
      const isActive = ["pending", "confirmed"].includes(appt.status);

      if (apptDay.getTime() === today.getTime() && isActive) {
        todayList.push(appt);
      } else if (apptDay > today && isActive) {
        upcoming.push(appt);
      } else {
        past.push(appt);
      }
    }

    
    todayList.sort((a, b) => a.tokenNumber - b.tokenNumber);
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    past.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      doctor,
      today: todayList,
      upcoming,
      past,
    });
  } catch (error) {
    return errorHandler(res, error);
  }
};

module.exports = {
  createAppointment,
  selfBookAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  deleteAppointment,
  getQueueStatus,
  matchDepartmentRoute,
  getMyAppointments,
  getMyDoctorSchedule,
  bookAppointment,
  getQueueStatusForDoctor,
  getOrCreatePatientForUser,
  matchDepartment,
  hasCompletePatientDetails,
  DAILY_CAP_PER_DOCTOR,
};