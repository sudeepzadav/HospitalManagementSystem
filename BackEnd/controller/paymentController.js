const crypto = require("crypto");
const Payment = require("../model/paymentSchema");
const Doctor = require("../model/doctorSchema");
const Appointment = require("../model/appointmentSchema");
// Note: your Patient model file is named patientSchema.js, not Patient.js.
const Patient = require("../model/patientSchema");

// ---- eSewa config, loaded from .env ----
// Make sure your entry point calls require("dotenv").config() before this
// file is loaded, so these are actually populated.
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE;
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY;
const ESEWA_STATUS_CHECK_URL = process.env.ESEWA_STATUS_CHECK_URL;

function signEsewaFields({ totalAmount, transactionUuid, productCode }) {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto
    .createHmac("sha256", ESEWA_SECRET_KEY)
    .update(message)
    .digest("base64");
}

// eSewa's success callback signs a different (and longer) set of fields
// than the initiate step — typically transaction_code, status,
// total_amount, transaction_uuid, product_code, signed_field_names, in
// that order. Rather than hardcoding that list, build the message from
// whatever `signed_field_names` says, since that's the actual contract.
function computeSignatureFromPayload(payload, signedFieldNames) {
  const message = signedFieldNames
    .split(",")
    .map((field) => `${field}=${payload[field]}`)
    .join(",");

  return crypto
    .createHmac("sha256", ESEWA_SECRET_KEY)
    .update(message)
    .digest("base64");
}

// Resolves the logged-in account + the specific person being booked for to
// a Patient profile document. Each distinct name under this account gets
// its own Patient record (so a parent, spouse, child, etc. each keep their
// own medical history), while booking the same name again reuses the
// existing record instead of duplicating it.
async function getAuthenticatedPatientId(req, patientName) {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    throw new Error("Not authenticated.");
  }

  let patient = await Patient.findOne({ userId, name: patientName });
  if (!patient) {
    patient = await Patient.create({ userId, name: patientName });
  }

  return patient._id;
}

// Placeholder token-number logic: counts existing active appointments for
// this doctor on this date and adds 1. Replace with whatever your booking
// system already uses elsewhere (e.g. the same logic behind
// /appointments/queue-status) so token numbers stay consistent.
async function getNextTokenNumber(doctorId, date) {
  const count = await Appointment.countDocuments({
    doctorId,
    date,
    status: { $in: ["pending", "confirmed"] },
  });
  return count + 1;
}

// POST /api/payments/esewa/initiate
async function initiateEsewaPayment(req, res) {
  try {
    const { doctorId, department, date, patient, amount, reason } = req.body;

    if (!doctorId || !department || !date || !patient?.name || !amount) {
      return res.status(400).json({ message: "Missing booking details." });
    }

    const patientId = await getAuthenticatedPatientId(req, patient.name);

    const transactionUuid = crypto.randomUUID();
    const totalAmount = Number(amount);

    const signature = signEsewaFields({
      totalAmount,
      transactionUuid,
      productCode: ESEWA_PRODUCT_CODE,
    });

    // Persist the pending payment so /verify can create the appointment
    // itself, instead of trusting whatever the client sends back.
    await Payment.create({
      transactionUuid,
      patientId,
      doctorId,
      department,
      date,
      reason,
      patientDetails: {
        name: patient.name,
        age: patient.age,
        gender: String(patient.gender).toLowerCase(),
      },
      amount: totalAmount,
      productCode: ESEWA_PRODUCT_CODE,
      status: "PENDING",
    });

    res.json({
      transactionUuid,
      amount: totalAmount,
      taxAmount: 0,
      totalAmount,
      productCode: ESEWA_PRODUCT_CODE,
      serviceCharge: 0,
      deliveryCharge: 0,
      signature,
      signedFieldNames: "total_amount,transaction_uuid,product_code",
    });
  } catch (err) {
    console.error("eSewa initiate error:", err);
    res.status(500).json({ message: err.message || "Could not start payment." });
  }
}

// POST /api/payments/esewa/verify
async function verifyEsewaPayment(req, res) {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ message: "Missing payment data." });
    }

    // eSewa appends this as a base64-encoded JSON string to success_url.
    const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    const {
      transaction_uuid,
      total_amount,
      product_code,
      status,
      signature,
      signed_field_names,
      transaction_code,
    } = decoded;

    const payment = await Payment.findOne({ transactionUuid: transaction_uuid });
    if (!payment) {
      return res
        .status(400)
        .json({ message: "Unknown or expired transaction." });
    }

    // If this was already verified (e.g. the user refreshed the success
    // page), just return the existing appointment instead of redoing work.
    if (payment.status === "COMPLETE" && payment.appointmentId) {
      const existing = await Appointment.findById(payment.appointmentId);
      return res.json({
        appointmentId: existing._id,
        tokenNumber: existing.tokenNumber,
        doctorId: payment.doctorId,
        date: payment.date,
        patient: payment.patientDetails,
      });
    }

    // Recompute the signature using eSewa's own signed_field_names so we
    // build the message the same way eSewa did — don't trust the redirect
    // payload blindly.
    const expectedSignature = computeSignatureFromPayload(
      decoded,
      signed_field_names
    );

    if (expectedSignature !== signature) {
      console.error("Signature mismatch debug:", {
        signed_field_names,
        decoded,
        expectedSignature,
        receivedSignature: signature,
      });
      payment.status = "FAILED";
      await payment.save();
      return res.status(400).json({ message: "Signature mismatch." });
    }

    if (status !== "COMPLETE") {
      payment.status = "FAILED";
      await payment.save();
      return res
        .status(400)
        .json({ message: `Payment not complete (status: ${status}).` });
    }

    // Double-check directly with eSewa's status-check API before trusting
    // the redirect at all — this is the step that actually confirms payment.
    const statusUrl = `${ESEWA_STATUS_CHECK_URL}?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`;
    const statusRes = await fetch(statusUrl);
    const statusData = await statusRes.json();

    if (statusData.status !== "COMPLETE") {
      payment.status = "FAILED";
      await payment.save();
      return res
        .status(400)
        .json({ message: "eSewa did not confirm this payment." });
    }

    // Look up the doctor's display name for the confirmation screen.
    let doctorName = "Doctor";
    try {
      const doctor = await Doctor.findById(payment.doctorId).populate(
        "userId",
        "name"
      );
      doctorName = doctor?.userId?.name || doctorName;
    } catch (lookupErr) {
      console.warn("Could not look up doctor name:", lookupErr.message);
    }

    // Create the actual appointment now that payment is confirmed.
    const appointment = await Appointment.create({
      patientId: payment.patientId,
      doctorId: payment.doctorId,
      department: payment.department,
      patientDetails: payment.patientDetails,
      date: payment.date,
      reason: payment.reason,
      tokenNumber: await getNextTokenNumber(payment.doctorId, payment.date),
      consultationFee: payment.amount,
      status: "confirmed",
      bookedVia: "patient_portal",
    });

    payment.status = "COMPLETE";
    payment.esewaRefId = transaction_code;
    payment.appointmentId = appointment._id;
    await payment.save();

    res.json({
      appointmentId: appointment._id,
      tokenNumber: appointment.tokenNumber,
      doctorId: payment.doctorId,
      doctorName,
      date: payment.date,
      patient: payment.patientDetails,
    });
  } catch (err) {
    console.error("eSewa verify error:", err);
    res.status(500).json({ message: err.message || "Could not verify payment." });
  }
}

module.exports = { initiateEsewaPayment, verifyEsewaPayment };