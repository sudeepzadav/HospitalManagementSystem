const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/auth");

const {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getCurrentUser,
  verifyEmail,
} = require("../controller/userController");

// Register user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Get currently logged-in user
router.get("/me", verifyUser, getCurrentUser);

// Get all users
router.get("/", getUsers);

//verify email
router.get("/verify-email/:token", verifyEmail);

// Get single user
router.get("/:id", getUserById);

// Update user
router.put("/:id", updateUser);

// Delete user
router.delete("/:id", deleteUser);

module.exports = router;