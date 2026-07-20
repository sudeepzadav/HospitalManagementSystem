const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    department: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    // Replaces the old `timeSlot`. Patients don't pick a time — they get the
    // next available number in that doctor's queue for the day.
    tokenNumber: {
      type: Number,
      required: true,
    },
    
    problem: {
      type: String,
    },

    reason: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "no_show"],
      default: "pending",
    },

    bookedVia: {
      type: String,
      enum: ["dashboard", "chatbot", "patient_portal"],
      default: "dashboard",
    },

    consultationFee: {
      type: Number,
      default: 0,
    },

    cancellationReason: {
      type: String,
    },

    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Normalize `date` to midnight so "how many appointments does this doctor
// have today" and the uniqueness check below both operate on the same
// calendar day, regardless of what time-of-day was passed in.
appointmentSchema.pre("save", function (next) {
  if (this.date) {
    const d = new Date(this.date);
    d.setHours(0, 0, 0, 0);
    this.date = d;
  }
  next();
});

// Prevent two active appointments from claiming the same token number
// for the same doctor on the same day.
appointmentSchema.index(
  { doctorId: 1, date: 1, tokenNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  },
);

module.exports = mongoose.model("Appointment", appointmentSchema);
