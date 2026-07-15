const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require("../controller/userController");


// Register user
router.post("/register", registerUser);


// Login user
router.post("/login", loginUser);


// Get all users
router.get("/", getUsers);


// Get single user
router.get("/:id", getUserById);


// Update user
router.put("/:id", updateUser);


// Delete user
router.delete("/:id", deleteUser);


module.exports = router;