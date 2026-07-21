const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/auth");

const {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getMyDoctorProfile,
  completeDoctorProfile,
} = require("../controller/doctorController");

// ======================
// Self-service routes — MUST be registered before "/:id",
// otherwise Express treats "my-profile" / "complete-profile" as an :id
// ======================

// Does the logged-in user already have a doctor profile?
router.get("/my-profile", verifyUser, getMyDoctorProfile);

// Create the logged-in user's own doctor profile (first-login setup step)
router.post("/complete-profile", verifyUser, completeDoctorProfile);

// ======================
// Public read routes (patients/chatbot browse doctors without logging in restrictions here)
// ======================
router.get("/", getDoctors);
router.get("/:id", getDoctorById);

// ======================
// Admin/dashboard routes — now require a logged-in user.
// NOTE: this only checks "is someone logged in", not "is this an admin".
// If you want only admins/receptionists to create or edit doctor records,
// add a role check here once you confirm the JWT payload includes `role`.
// ======================
router.post("/", verifyUser, createDoctor);
router.put("/:id", verifyUser, updateDoctor);
router.delete("/:id", verifyUser, deleteDoctor);

module.exports = router;