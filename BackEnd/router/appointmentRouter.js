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
} = require("../controller/appointmentController");

// Match a free-text problem description to a real department
// e.g. POST /api/appointments/match-department  { problem: "chest pain" }
router.post("/match-department", verifyUser, matchDepartmentRoute);

// Get queue status (count + next token number) for a doctor on a given date
// e.g. GET /api/appointments/queue-status?doctorId=...&date=2026-07-22
router.get("/queue-status", verifyUser, getQueueStatus);

// Create an appointment (dashboard / receptionist flow — requires patientId)
router.post("/", verifyUser, createAppointment);

// Self-book an appointment as the logged-in patient (used by the chatbot)
router.post("/self-book", verifyUser, selfBookAppointment);

// Get appointments (supports ?doctorId=&patientId=&status=&date=)
router.get("/", verifyUser, getAppointments);

// Get a single appointment
router.get("/:id", verifyUser, getAppointmentById);

// Update appointment status (confirm/cancel/complete/no-show)
router.put("/:id/status", verifyUser, updateAppointmentStatus);

// Delete an appointment
router.delete("/:id", verifyUser, deleteAppointment);

module.exports = router;