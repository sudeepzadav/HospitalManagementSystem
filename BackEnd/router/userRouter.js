const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/auth");
const upload = require("../utils/multer");

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
} = require("../controller/userController");

// Register user
router.post("/register", registerUser);

//upload user picture
router.post("/profile-picture",verifyUser,upload.single("image"), uploadUserProfilePicture);

// Login user
router.post("/login", loginUser);

// Get currently logged-in user
router.get("/me", verifyUser, getCurrentUser);

// Get all users
router.get("/", getUsers);

//verify email
router.get("/verify-email/:token", verifyEmail);

// get user growth
router.get("/growth", getUserGrowth);

// Get single user
router.get("/:id", getUserById);

// Update user
router.put("/update/:id", verifyUser, updateUser);

// Delete user
router.delete("/:id", deleteUser);

module.exports = router;