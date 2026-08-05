const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    specialization: {
      type: String,
      required: true,
      trim: true
    },

    department: {
      type: String,
      required: true,
      trim: true
    },

    qualification: [
      {
        type: String,
        trim: true
      }
    ],

    experience: {
      type: Number,
      default: 0
    },

    licenseNumber: {
      type: String,
      unique: true,
      trim: true
    },

    consultationFee: {
      type: Number,
      default: 0
    },

    availability: [
      {
        day: {
          type: String,
          trim: true
        },

        startTime: {
          type: String
        },

        endTime: {
          type: String
        }
      }
    ],

    rating: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Doctor", doctorSchema);