const JobApplication = require("../model/jobApplicationSchema");
const Job = require("../model/jobSchema");

// POST 
const submitApplication = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { applicantName, email, phone, coverLetter } = req.body;

    if (!applicantName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and phone are required.",
      });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please attach a resume." });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "This job posting no longer exists." });
    }
    if (job.status !== "open") {
      return res.status(409).json({
        success: false,
        message: "This position is no longer accepting applications.",
      });
    }

    const application = await JobApplication.create({
      jobId,
      applicantName,
      email,
      phone,
      coverLetter,
      resumePath: `/uploads/${req.file.filename}`,
    });

    res.status(201).json({
      success: true,
      message: "Application submitted — we'll be in touch if there's a match.",
      application,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET 
const getApplicationsForJob = async (req, res) => {
  try {
    const applications = await JobApplication.find({ jobId: req.params.jobId }).sort({
      createdAt: -1,
    });
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET 
const getAllApplications = async (req, res) => {
  try {
    const applications = await JobApplication.find()
      .populate("jobId", "title department")
      .sort({ createdAt: -1 });
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH 
const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["submitted", "reviewing", "shortlisted", "rejected", "hired"];
    if (!valid.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${valid.join(", ")}`,
      });
    }

    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }
    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitApplication,
  getApplicationsForJob,
  getAllApplications,
  updateApplicationStatus,
};