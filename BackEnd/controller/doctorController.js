const Doctor = require("../model/doctorSchema");

// ======================
// Create Doctor (admin/dashboard use — expects userId in body)
// ======================
const createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);

    res.status(201).json({
      message: "Doctor created",
      doctor,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "That license number is already registered" });
    }
    res.status(500).json({
      message: error.message,
    });
  }
};

// ======================
// Get Doctors
// ======================
const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate("userId");

    res.json(doctors);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ======================
// Get Doctor By ID
// ======================
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate("userId");

    res.json(doctor);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ======================
// Update Doctor
// ======================
const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json(doctor);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ======================
// Delete Doctor
// ======================
const deleteDoctor = async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);

    res.json({
      message: "Doctor deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ======================
// Self-service: does the logged-in user already have a Doctor profile?
// Used right after login to decide whether to send a doctor to the
// "complete your profile" page or straight to their dashboard.
// ======================
const getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id }).populate("userId");
    // Not an error if it doesn't exist yet — the frontend uses `doctor: null`
    // to know it should show the profile-setup form.
    res.status(200).json({ success: true, doctor: doctor || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================
// Self-service: create the logged-in user's own Doctor profile
// (the "complete your profile" step after first login/signup)
// ======================
const completeDoctorProfile = async (req, res) => {
  try {
    const { department, specialization, qualification, licenseNumber, consultationFee, availability } =
      req.body;

    if (!department || !specialization) {
      return res.status(400).json({
        success: false,
        message: "department and specialization are required",
      });
    }

    const existing = await Doctor.findOne({ userId: req.user.id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already have a doctor profile",
        doctor: existing,
      });
    }

    const doctor = await Doctor.create({
      userId: req.user.id,
      department,
      specialization,
      qualification,
      licenseNumber,
      consultationFee,
      availability,
    });

    return res.status(201).json({ success: true, doctor });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "That license number is already registered",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getMyDoctorProfile,
  completeDoctorProfile,
};