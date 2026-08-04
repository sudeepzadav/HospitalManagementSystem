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
    
    failureReason: {
      type: String,
    },
   
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