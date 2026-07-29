const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    transactionUuid: {
      type: String,
      required: true,
      unique: true,
    },
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
    // Who the appointment is actually for (may differ from the account
    // holder — booking for a spouse, child, parent, etc).
    patientDetails: {
      name: { type: String, required: true },
      age: { type: Number, required: true },
      gender: {
        type: String,
        enum: ["male", "female", "other"],
        required: true,
      },
    },
    date: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    productCode: {
      type: String,
      default: "EPAYTEST",
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETE", "FAILED"],
      default: "PENDING",
    },
    // Set whenever status becomes "FAILED" — signature mismatch, eSewa
    // status-check rejection, or (rarely) the appointment itself failing
    // to create after payment was otherwise verified. Without this, that
    // reason only ever lived in a one-time API response the user might
    // never have seen, with zero record left in the database afterward.
    failureReason: {
      type: String,
    },
    // eSewa's own transaction reference, filled in once verified.
    esewaRefId: {
      type: String,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);