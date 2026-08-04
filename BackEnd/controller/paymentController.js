const crypto = require("crypto");
const Payment = require("../model/paymentSchema");
const Doctor = require("../model/doctorSchema");
const Appointment = require("../model/appointmentSchema");
const Patient = require("../model/patientSchema");

// ---- eSewa config, loaded from .env ----
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE;
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY;
const ESEWA_STATUS_CHECK_URL = process.env.ESEWA_STATUS_CHECK_URL;

function signEsewaFields({ totalAmount, transactionUuid, productCode }) {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac("sha256", ESEWA_SECRET_KEY).update(message).digest("base64");
}


function computeSignatureFromPayload(payload, signedFieldNames) {
  const message = signedFieldNames
    .split(",")
    .map((field) => `${field}=${payload[field]}`)
    .join(",");

  return crypto.createHmac("sha256", ESEWA_SECRET_KEY).update(message).digest("base64");
}


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


async function markFailed(payment, reason) {
  payment.status = "FAILED";
  payment.failureReason = reason;
  await payment.save();
}

// POST /api/payments/esewa/verify
async function verifyEsewaPayment(req, res) {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ message: "Missing payment data." });
    }

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
      return res.status(400).json({ message: "Unknown or expired transaction." });
    }

  
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

    
    const expectedSignature = computeSignatureFromPayload(decoded, signed_field_names);

    if (expectedSignature !== signature) {
      console.error("Signature mismatch debug:", {
        signed_field_names,
        decoded,
        expectedSignature,
        receivedSignature: signature,
      });
      await markFailed(payment, "Signature mismatch during eSewa verification.");
      return res.status(400).json({ message: "Signature mismatch." });
    }

    if (status !== "COMPLETE") {
      await markFailed(payment, `eSewa reported payment status "${status}" instead of COMPLETE.`);
      return res.status(400).json({ message: `Payment not complete (status: ${status}).` });
    }

    const statusUrl = `${ESEWA_STATUS_CHECK_URL}?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`;
    const statusRes = await fetch(statusUrl);
    const statusData = await statusRes.json();

    if (statusData.status !== "COMPLETE") {
      await markFailed(
        payment,
        `eSewa's status-check API returned "${statusData.status}" instead of COMPLETE.`
      );
      return res.status(400).json({ message: "eSewa did not confirm this payment." });
    }

    // Look up the doctor's display name for the confirmation screen.
    let doctorName = "Doctor";
    try {
      const doctor = await Doctor.findById(payment.doctorId).populate("userId", "name");
      doctorName = doctor?.userId?.name || doctorName;
    } catch (lookupErr) {
      console.warn("Could not look up doctor name:", lookupErr.message);
    }

    let appointment;
    try {
      appointment = await Appointment.create({
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
    } catch (apptErr) {
      console.error("Appointment creation failed after verified payment:", apptErr.message);
      await markFailed(
        payment,
        `Payment was verified by eSewa, but the appointment could not be created: ${apptErr.message}`
      );
      return res.status(409).json({
        message:
          "Your payment was verified, but we couldn't finalize the appointment (the slot may have just filled up). Please contact support with your payment reference — you'll be refunded or rebooked.",
        transactionUuid: transaction_uuid,
      });
    }

    payment.status = "COMPLETE";
    payment.failureReason = undefined;
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

// ======================
// Route: Get the logged-in user's own payment history (patient dashboard)
// ======================
const getMyPayments = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const myPatientIds = await Patient.find({ userId }).distinct("_id");

    const payments = await Payment.find({ patientId: { $in: myPatientIds } })
      .populate({
        path: "appointmentId",
        populate: { path: "doctorId", populate: { path: "userId", select: "name" } },
      })
      .sort({ createdAt: -1 });

    const withFlags = payments.map((p) => ({
      _id: p._id,
      transactionUuid: p.transactionUuid,
      amount: p.amount,
      status: p.status, // "PENDING" | "COMPLETE" | "FAILED"
      department: p.department,
      date: p.date,
      createdAt: p.createdAt,
      appointment: p.appointmentId || null,
      failed: p.status === "FAILED",
      failureReason: p.status === "FAILED" ? p.failureReason : undefined,
    }));

    res.status(200).json({ success: true, payments: withFlags });
  } catch (error) {
    console.error("getMyPayments error:", error.message);
    res.status(500).json({ success: false, message: "Could not load payment history." });
  }
};

// ======================
// Route (ADMIN): List every failed payment, newest first, so support can
// ======================
const getPaymentIssues = async (req, res) => {
  try {
    const issues = await Payment.find({ status: "FAILED" })
      .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, issues });
  } catch (error) {
    console.error("getPaymentIssues error:", error.message);
    res.status(500).json({ success: false, message: "Could not load payment issues." });
  }
};

// ======================
// Route (ADMIN): Retry appointment creation for a payment that was
// ======================
const retryFailedBooking = async (req, res) => {
  try {
    const { transactionUuid } = req.params;
    const payment = await Payment.findOne({ transactionUuid });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (payment.status !== "FAILED" || payment.appointmentId) {
      return res.status(409).json({
        success: false,
        message: "This payment isn't in a retryable failed state.",
      });
    }

    const tokenNumber = await getNextTokenNumber(payment.doctorId, payment.date);

    let appointment;
    try {
      appointment = await Appointment.create({
        patientId: payment.patientId,
        doctorId: payment.doctorId,
        department: payment.department,
        patientDetails: payment.patientDetails,
        date: payment.date,
        reason: payment.reason,
        tokenNumber,
        consultationFee: payment.amount,
        status: "confirmed",
        bookedVia: "patient_portal",
      });
    } catch (apptErr) {
      payment.failureReason = `Retry failed: ${apptErr.message}`;
      await payment.save();
      return res.status(409).json({ success: false, message: apptErr.message });
    }

    payment.status = "COMPLETE";
    payment.failureReason = undefined;
    payment.appointmentId = appointment._id;
    await payment.save();

    return res.status(200).json({ success: true, appointment });
  } catch (error) {
    console.error("retryFailedBooking error:", error.message);
    res.status(500).json({ success: false, message: "Retry failed." });
  }
};

module.exports = {
  initiateEsewaPayment,
  verifyEsewaPayment,
  getMyPayments,
  getPaymentIssues,
  retryFailedBooking,
};