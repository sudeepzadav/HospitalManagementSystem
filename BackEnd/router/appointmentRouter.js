const express = require("express");
const router = express.Router();


const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  deleteAppointment
} = require("../controller/appointmentController");



// Create appointment
router.post("/", createAppointment);


// Get all appointments
router.get("/", getAppointments);


// Get appointment by id
router.get("/:id", getAppointmentById);


// Update appointment status
router.put("/:id/status", updateAppointmentStatus);


// Delete appointment
router.delete("/:id", deleteAppointment);



module.exports = router;