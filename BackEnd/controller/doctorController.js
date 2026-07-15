const Doctor = require("../model/doctorSchema");

// Create Doctor
const createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);

    res.status(201).json({
      message: "Doctor created",
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Doctors
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

// Get Doctor By ID
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

// Update Doctor
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

// Delete Doctor
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

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};
