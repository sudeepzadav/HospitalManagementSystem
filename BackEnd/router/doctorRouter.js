const express = require("express");
const router = express.Router();


const {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
} = require("../controller/doctorController");



// Create doctor profile
router.post("/", createDoctor);


// Get all doctors
router.get("/", getDoctors);


// Get doctor by id
router.get("/:id", getDoctorById);


// Update doctor
router.put("/:id", updateDoctor);


// Delete doctor
router.delete("/:id", deleteDoctor);



module.exports = router;