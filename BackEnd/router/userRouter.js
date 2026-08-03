const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const uploadProfilePicture = require("../utils/multer"); // reuses your existing multer setup

const {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getCurrentUser,
  verifyEmail,
  getUserGrowth,
  uploadUserProfilePicture,
  getPendingApprovals,
  approveUser,
  rejectUser,
} = require("../controller/userController");

// Register user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Get currently logged-in user
router.get("/me", verifyUser, getCurrentUser);

// Upload / replace the logged-in user's profile picture.
// verifyUser MUST run before the multer middleware — the upload
// middleware's filename function reads req.user to name the file.
router.post(
  "/profile-picture",
  verifyUser,
  uploadProfilePicture.single("image"),
  uploadUserProfilePicture
);

// User signups per month, for the admin dashboard growth chart.
// MUST stay above "/:id" or the literal string "growth" gets matched as
// an :id param instead.
router.get("/growth", verifyUser, isAdmin, getUserGrowth);

// Pending doctor/staff accounts awaiting admin approval.
// Also above "/:id" for the same reason.
router.get("/pending-approvals", verifyUser, isAdmin, getPendingApprovals);
router.put("/:id/approve", verifyUser, isAdmin, approveUser);
router.put("/:id/reject", verifyUser, isAdmin, rejectUser);

// Get all users — admin-only.
// FIXED: previously had no auth at all, exposing every user's data
// (minus password) to anyone, logged in or not.
router.get("/", verifyUser, isAdmin, getUsers);

// Verify email
router.get("/verify-email/:token", verifyEmail);

// Get single user
// FIXED: previously had no auth at all. Now requires login; consider
// further restricting to self-or-admin inside the controller if patient
// records shouldn't be viewable by other patients.
router.get("/:id", verifyUser, getUserById);

// Update user
// FIXED: previously had NO verifyUser middleware, even though the
// controller reads req.user.id/req.user.role — every request here was
// throwing, since req.user didn't exist.
router.put("/:id", verifyUser, updateUser);

// Delete user
// FIXED: same missing-middleware bug as updateUser above.
router.delete("/:id", verifyUser, deleteUser);

module.exports = router;