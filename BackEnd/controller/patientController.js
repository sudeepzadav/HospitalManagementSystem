const Patient = require("../model/patientSchema");

// Create Patient
const createPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);

    res.status(201).json({
      message: "Patient created successfully",
      patient,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get All Patients
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().populate("userId");

    res.status(200).json({
      patients,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Patient By ID
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate("userId");

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update Patient
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json({
      message: "Patient updated",
      patient,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Patient
const deletePatient = async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Patient deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
};
