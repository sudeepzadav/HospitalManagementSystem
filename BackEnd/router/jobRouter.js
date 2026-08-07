const express = require("express");
const router = express.Router();

const {
  createJob,
  getOpenJobs,
  getAllJobs,
  getJobById,
  updateJob,
  setJobStatus,
  deleteJob,
} = require("../controller/jobController");
const { submitApplication } = require("../controller/jobApplicationController");

const verifyUser = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const upload = require("../utils/multer");


router.get("/", getOpenJobs);

router.get("/admin", verifyUser, isAdmin, getAllJobs);

router.post("/", verifyUser, isAdmin, createJob);

router.get("/:id", getJobById);
router.put("/:id", verifyUser, isAdmin, updateJob);
router.patch("/:id/status", verifyUser, isAdmin, setJobStatus);
router.delete("/:id", verifyUser, isAdmin, deleteJob);


router.post("/:id/apply", upload.single("resume"), submitApplication);

module.exports = router;