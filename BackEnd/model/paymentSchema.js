const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },

    department: {
      type: String
    },

    date: {
      type: Date,
      required: true
    },

    reason: {
      type: String
    },

    patientDetails: {
      name: { type: String, required: true },
      age: { type: Number, required: true },
      gender: { type: String, enum: ["male", "female", "other"], required: true }
    },

    amount: {
      type: Number,
      required: true
    },

    transactionUuid: {
      type: String,
      required: true,
      unique: true
    },

    productCode: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending"
    },

    esewaRefId: {
      type: String
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    },

    rawResponse: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Payment", paymentSchema);