const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },

    department: {
      type: String,
      required: true
    },

    // Who the appointment is actually for — may differ from the logged-in
    // account holder (e.g. booking for a spouse, child, or parent).
    patientDetails: {
      name: {
        type: String,
        required: true
      },
      age: {
        type: Number,
        required: true
      },
      gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: true
      }
    },

    date: {
      type: Date,
      required: true
    },

    tokenNumber: {
      type: Number,
      required: true
    },

    reason: {
      type: String
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "no_show"],
      default: "pending"
    },

    bookedVia: {
      type: String,
      enum: ["dashboard", "chatbot", "patient_portal"],
      default: "dashboard"
    },

    consultationFee: {
      type: Number,
      default: 0
    },

    cancellationReason: {
      type: String
    },

    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Prevent two active appointments from getting the same token number for the same doctor + day
appointmentSchema.index(
  { doctorId: 1, date: 1, tokenNumber: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "confirmed"] } } }
);

module.exports = mongoose.model("Appointment", appointmentSchema);