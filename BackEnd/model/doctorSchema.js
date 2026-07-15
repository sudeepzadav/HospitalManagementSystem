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
      required: true
    },

    department: {
      type: String,
      required: true
    },

    qualification: [
      {
        type: String
      }
    ],

    experience: {
      type: Number,
      default: 0
    },

    licenseNumber: {
      type: String,
      unique: true
    },

    consultationFee: {
      type: Number,
      default: 0
    },

    availability: [
      {
        day: {
          type: String
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