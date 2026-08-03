const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6
    },

    phone: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: [
        "admin",
        "doctor",
        "nurse",
        "receptionist",
        "patient",
        "pharmacist",
        "lab_technician",
        "accountant",
        "staff"
      ],
      default: "patient"
    },

    
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: function () {
        return this.role === "patient" ? "approved" : "pending";
      }
    },

    
    rejectionReason: {
      type: String
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"]
    },

    dateOfBirth: {
      type: Date
    },

    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },

    profileImage: {
      type: String,
      default: ""
    },

    isActive: {
      type: Boolean,
      default: true
    },

    verify: {
      type: Boolean,
      default: false
    },

    lastLogin: {
      type: Date
    },

    permissions: [
      {
        type: String
      }
    ]

  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);