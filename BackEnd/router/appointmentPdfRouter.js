const express = require("express");
const router = express.Router();
const { generateAppointmentPdf } = require("../controller/appointmentPdfController");
// Adjust this path if it lives somewhere else.
const verifyUser = require("../middleware/auth");

router.get("/:id/pdf", verifyUser, generateAppointmentPdf);

module.exports = router;