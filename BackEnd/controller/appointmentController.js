const Appointment = require("../model/appointmentSchema");
const Doctor = require("../model/doctorSchema");
const Patient = require("../model/patientSchema");
const errorHandler = require("../utils/errorHandler");

const MAX_TOKENS_PER_DAY = 20;

// ======================
// Symptom -> Department keyword map
// Add/expand freely as you notice gaps. Matching is case-insensitive and
// looks for whole keywords anywhere in the patient's text.
// ======================
const DEPARTMENT_KEYWORDS = {
  Cardiology: ["chest", "heart", "palpitation", "bp", "blood pressure"],
  Dermatology: ["skin", "rash", "itch", "itchy", "acne", "eczema"],
  Neurology: ["headache", "migraine", "seizure", "dizzy", "dizziness", "numbness"],
  Orthopedics: ["bone", "joint", "fracture", "back pain", "knee", "shoulder", "sprain"],
  ENT: ["ear", "nose", "throat", "sinus", "hearing"],
  Gastroenterology: ["stomach", "abdomen", "abdominal", "vomit", "diarrhea", "acidity", "nausea"],
  Pediatrics: ["child", "baby", "infant", "toddler"],
  Gynecology: ["pregnancy", "pregnant", "menstrual", "period"],
  Ophthalmology: ["eye", "vision", "blurry"],
  Psychiatry: ["anxiety", "depression", "stress", "insomnia", "sleep"],
  General: ["fever", "cold", "cough", "fatigue", "flu"],
};

// ======================
// Helper: match free-text problem description to a department that
// actually exists in this hospital's Doctor collection. Returns null if
// nothing matches (caller should fall back to showing all departments).
// ======================
function matchDepartment(problemText, availableDepartments = []) {
  if (!problemText) return null;
  const text = problemText.toLowerCase();
  const availableSet = new Set(availableDepartments.map((d) => d.toLowerCase()));

  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    if (!availableSet.has(dept.toLowerCase())) continue; // only suggest depts that exist in DB
    if (keywords.some((kw) => text.includes(kw))) {
      // Return the department's actual casing as stored in availableDepartments
      return availableDepartments.find((d) => d.toLowerCase() === dept.toLowerCase());
    }
  }
  return null;
}

// ======================
// Helper: does this doctor work on the given date's weekday?
// ======================
function isDoctorAvailableOnDate(doctor, dateObj) {
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  return doctor.availability.some((a) => a.day.toLowerCase() === dayName.toLowerCase());
}

// ======================
// Helper: current queue status for a doctor on a given day
// ======================
async function getQueueStatusForDoctor(doctorId, dateString) {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return { error: "Doctor not found" };

  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);

  if (!isDoctorAvailableOnDate(doctor, date)) {
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    return {
      dayAvailable: false,
      message: `This doctor is not available on ${dayName}s.`,
    };
  }

  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await Appointment.countDocuments({
    doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ["pending", "confirmed"] },
  });

  return {
    dayAvailable: true,
    count,
    nextToken: count + 1,
    maxPerDay: MAX_TOKENS_PER_DAY,
    isFull: count >= MAX_TOKENS_PER_DAY,
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
// Core: assign the next token number and create the appointment.
// Shared by both the dashboard route (explicit patientId) and the
// self-book route (patientId resolved from the logged-in user).
// Retries a few times if two requests race for the same token number.
// ======================
async function assignTokenAndCreate({ patientId, doctorId, department, date, problem, reason, bookedVia }) {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return { success: false, message: "Doctor not found" };
  }

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  if (!isDoctorAvailableOnDate(doctor, dateObj)) {
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    return { success: false, message: `Doctor is not available on ${dayName}s` };
  }

  const startOfDay = new Date(dateObj);
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  const MAX_ATTEMPTS = 3;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const count = await Appointment.countDocuments({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["pending", "confirmed"] },
    });

    if (count >= MAX_TOKENS_PER_DAY) {
      return { success: false, message: "This doctor is fully booked for that day (20/20). Please pick another date or doctor." };
    }

    try {
      const appointment = await Appointment.create({
        patientId,
        doctorId,
        department: department || doctor.department,
        date: dateObj,
        tokenNumber: count + 1,
        problem,
        reason,
        status: "pending",
        bookedVia: bookedVia || "dashboard",
        consultationFee: doctor.consultationFee,
      });

      return { success: true, appointment };
    } catch (error) {
      // Someone else grabbed that token number in the same instant — retry
      if (error.code === 11000 && attempt < MAX_ATTEMPTS - 1) {
        continue;
      }
      if (error.code === 11000) {
        return { success: false, message: "That slot was just taken, please try again." };
      }
      return { success: false, message: error.message };
    }
  }

  return { success: false, message: "Could not book at this time, please try again." };
}

// ======================
// Route: Create Appointment (dashboard / receptionist use)
// ======================
const createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, department, date, problem, reason } = req.body;

    if (!patientId || !doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "patientId, doctorId, and date are required",
      });
    }

    const result = await assignTokenAndCreate({
      patientId,
      doctorId,
      department,
      date,
      problem,
      reason,
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
// Route: Self-book (patient books for themselves, e.g. via chatbot)
// ======================
const selfBookAppointment = async (req, res) => {
  try {
    const { doctorId, department, date, problem, reason } = req.body;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "doctorId and date are required",
      });
    }

    const patient = await getOrCreatePatientForUser(req.user.id);

    const result = await assignTokenAndCreate({
      patientId: patient._id,
      doctorId,
      department,
      date,
      problem,
      reason,
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
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
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
// (replaces the old getAvailableSlots — no time slots anymore, just a count)
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
      matchedDepartment: matched, // null if nothing matched
      departments,
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
  // exported for reuse elsewhere (not HTTP routes)
  assignTokenAndCreate,
  getQueueStatusForDoctor,
  getOrCreatePatientForUser,
  matchDepartment,
};