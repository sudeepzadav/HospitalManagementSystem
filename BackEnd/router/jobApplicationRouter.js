const express = require("express");
const router = express.Router();

const {
  getApplicationsForJob,
  getAllApplications,
  updateApplicationStatus,
} = require("../controller/jobApplicationController");

const verifyUser = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");



router.get("/", verifyUser, isAdmin, getAllApplications);
router.get("/job/:jobId", verifyUser, isAdmin, getApplicationsForJob);
router.patch("/:id/status", verifyUser, isAdmin, updateApplicationStatus);

module.exports = router;