const User = require("../model/userSchema");
const bcrypt = require("bcrypt");
const errorHandler = require("../utils/errorHandler");
const path = require("path");
const fs = require("fs");
const {
  generateAcessToken,
  generateRefreshToken,
  generateVerificationToken,
  verifyToken,
} = require("../utils/generateTokens");

const { sendVerificationEmail } = require("../utils/sendEmail");

// Verify Email
async function verifyEmail(req, res) {
  try {
    const { token } = req.params;
    const decoded = verifyToken(token);
    console.log("DEBUG decoded:", decoded);

    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

     

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.verify) {
      return res
        .status(400)
        .json({ success: false, message: "Email already verified" });
    }

    user.verify = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now login.",
    });
  } catch (error) {
    return errorHandler(res, error);
  }
}

// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Generic message avoids confirming whether the email is already registered
      return res.status(400).json({
        success: false,
        message: "Unable to register with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || "patient",
    });

    // Send verification email on registration
    const verificationToken = generateVerificationToken({
      id: user._id,
      email: user.email,
    });
    await sendVerificationEmail(user.email, verificationToken);

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(201).json({
      success: true,
      message: "Registered successfully. Please check your email to verify your account.",
      user: safeUser,
    });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const user = await User.findOne({ email });

    // Generic message: don't reveal whether the email exists or the password was wrong
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Block login until the email is verified, and resend the verification email
    if (!user.verify) {
      const verificationToken = generateVerificationToken({
        id: user._id,
        email: user.email,
      });
      await sendVerificationEmail(user.email, verificationToken);

      return res.status(403).json({
        success: false,
        message: "Please verify your email. A new verification link has been sent.",
      });
    }

    const accessToken = generateAcessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: accessToken,
      refreshToken,
      user: safeUser,
    });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// Get Current User
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// Get all users (should be admin-only — enforce in route middleware)
const getUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const users = await User.find()
      .select("-password")
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ success: true, page, limit, users });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// Update User
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // self-or-admin authorization check
    if (req.user.id !== id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this account",
      });
    }

    // Explicit allow-list — never spread req.body directly into the update.
    // This blocks mass-assignment of role, password, verify, etc.
    const { name, email, phone, password } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    // Only an admin may change role, and only explicitly
    if (req.user.role === "admin" && req.body.role) {
      updateData.role = req.body.role;
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // self-or-admin authorization check
    if (req.user.id !== id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this account",
      });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    return errorHandler(res, error);
  }
};

//users grow
const getUserGrowth = async (req, res) => {
  try {
    const months = Math.min(parseInt(req.query.months) || 6, 24);
 
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
 
    const raw = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);
 
    const countMap = new Map(raw.map((r) => [`${r._id.year}-${r._id.month}`, r.count]));
 
    const result = [];
    const cursor = new Date(since);
    for (let i = 0; i < months; i++) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth() + 1}`;
      result.push({
        month: cursor.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        count: countMap.get(key) || 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
 
    res.status(200).json({ success: true, growth: result });
  } catch (error) {
    console.error("getUserGrowth error:", error.message);
    res.status(500).json({ success: false, message: "Could not load user growth." });
  }
};

//upload profile Picture
const uploadUserProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file received." });
    }
 
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId);
 
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
 
    
    if (user.profileImage) {
      const oldPath = path.join(__dirname, "..", user.profileImage);
      fs.unlink(oldPath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.warn("Could not delete old profile picture:", err.message);
        }
      });
    }
 
    
    const relativePath = `/uploads/${req.file.filename}`;
    user.profileImage = relativePath;
    await user.save();
 
    res.status(200).json({ success: true, profileImage: relativePath, user });
  } catch (error) {
    console.error("uploadUserProfilePicture error:", error.message);
    res.status(500).json({ success: false, message: "Could not upload image." });
  }
};

module.exports = {
  verifyEmail,
  registerUser,
  getCurrentUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserGrowth,
  uploadUserProfilePicture,
};