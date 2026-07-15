const express = require("express");
const router = express.Router();


const {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient
} = require("../controller/patientController");



// Create patient
router.post("/", createPatient);


// Get all patients
router.get("/", getPatients);


// Get patient by id
router.get("/:id", getPatientById);


// Update patient
router.put("/:id", updatePatient);


// Delete patient
router.delete("/:id", deletePatient);



module.exports = router;