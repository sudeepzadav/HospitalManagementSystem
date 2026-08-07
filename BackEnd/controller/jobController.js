const Job = require("../model/jobSchema");

// POST 
const createJob = async (req, res) => {
  try {
    const { title, department, employmentType, location, description, requirements } = req.body;

    if (!title || !department || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, department, and description are required.",
      });
    }

    const job = await Job.create({
      title,
      department,
      employmentType,
      location,
      description,
      requirements: Array.isArray(requirements)
        ? requirements
        : requirements
        ? requirements.split(",").map((r) => r.trim()).filter(Boolean)
        : [],
      postedBy: req.user.id,
    });

    res.status(201).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/jobs  (public — open positions only)
const getOpenJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "open" }).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate("postedBy", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found." });
    }
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found." });
    }
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const setJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["open", "closed"].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be 'open' or 'closed'." });
    }

    const job = await Job.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found." });
    }
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE 
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found." });
    }
    res.json({ success: true, message: "Job deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createJob,
  getOpenJobs,
  getAllJobs,
  getJobById,
  updateJob,
  setJobStatus,
  deleteJob,
};