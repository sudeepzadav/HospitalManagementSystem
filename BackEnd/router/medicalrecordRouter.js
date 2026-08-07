const express = require("express");
const router = express.Router();


const {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord
} = require("../controller/medicalrecordController");



// Create medical record
router.post("/", createMedicalRecord);


// Get all medical records
router.get("/", getMedicalRecords);


// Get single medical record
router.get("/:id", getMedicalRecordById);


// Update medical record
router.put("/:id", updateMedicalRecord);


// Delete medical record
router.delete("/:id", deleteMedicalRecord);



module.exports = router;