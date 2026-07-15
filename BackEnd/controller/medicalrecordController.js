const MedicalRecord = require("../model/medicalrecordSchema");

// Create Medical Record
const createMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.create(req.body);

    res.status(201).json({
      message: "Medical record created",
      record,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get All Medical Records
const getMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find()
      .populate({
        path: "patientId",
        populate: {
          path: "userId",
        },
      })
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
        },
      })
      .populate("appointmentId");

    res.json(records);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get Medical Record By ID
const getMedicalRecordById = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate("patientId")
      .populate("doctorId")
      .populate("appointmentId");

    if (!record) {
      return res.status(404).json({
        message: "Medical record not found",
      });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update Medical Record
const updateMedicalRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      },
    );

    res.json({
      message: "Medical record updated",
      record,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Medical Record
const deleteMedicalRecord = async (req, res) => {
  try {
    await MedicalRecord.findByIdAndDelete(req.params.id);

    res.json({
      message: "Medical record deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
};
