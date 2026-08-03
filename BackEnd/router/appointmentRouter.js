const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/auth");

const {
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
} = require("../controller/appointmentController");

// Match a free-text symptom description to a real department (optional, used if not done client-side)
router.post("/match-department", matchDepartmentRoute);

// Get queue status for a doctor on a given date (booked count / capacity / next token / weekday availability)
// e.g. GET /api/appointments/queue-status?doctorId=...&date=2026-07-22
router.get("/queue-status", verifyUser, getQueueStatus);

// Create an appointment (dashboard / receptionist flow — requires patientId)
router.post("/", verifyUser, createAppointment);

// Self-book an appointment as the logged-in patient (used by the chatbot)
router.post("/self-book", verifyUser, selfBookAppointment);

// Get appointments (supports ?doctorId=&patientId=&status=&date=)
router.get("/", verifyUser, getAppointments);

//get my appointment
router.get("/my-appointments", verifyUser, getMyAppointments);

// Get the logged-in DOCTOR's own schedule (today's queue / upcoming / past)
// Must stay above "/:id" or the literal string "my-schedule" gets matched
// as an :id param instead.
router.get("/my-schedule", verifyUser, getMyDoctorSchedule);

// Get a single appointment
router.get("/:id", verifyUser, getAppointmentById);

// Update appointment status (confirm/cancel/complete/no-show)
router.put("/:id/status", verifyUser, updateAppointmentStatus);

// Delete an appointment
router.delete("/:id", verifyUser, deleteAppointment);

module.exports = router;