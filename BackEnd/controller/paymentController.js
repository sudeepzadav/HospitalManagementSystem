const crypto = require("crypto");
const Payment = require("../model/paymentSchema");
const Doctor = require("../model/doctorSchema");
const errorHandler = require("../utils/errorHandler");
const {
  bookAppointment,
  getQueueStatusForDoctor,
} = require("./appointmentController");

const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
const ESEWA_GATEWAY_URL = process.env.ESEWA_GATEWAY_URL || "https://rc-epay.esewa.com.np";
const ESEWA_STATUS_URL =
  process.env.ESEWA_STATUS_URL || "https://uat.esewa.com.np/api/epay/transaction/status";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ======================
// Helper: HMAC-SHA256 signature per eSewa ePay v2 spec
// ======================
function generateSignature(totalAmount, transactionUuid, productCode, secretKey) {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto.createHmac("sha256", secretKey).update(message).digest("base64");
}

// Build the same message using whatever field order eSewa tells us it signed (signed_field_names)
function generateSignatureFromFields(fields, signedFieldNames, secretKey) {
  const names = signedFieldNames.split(",");
  const message = names.map((name) => `${name}=${fields[name]}`).join(",");
  return crypto.createHmac("sha256", secretKey).update(message).digest("base64");
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a || "");
  const bufB = Buffer.from(b || "");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ======================
// Route: Initiate a payment for an upcoming appointment
// ======================
const initiatePayment = async (req, res) => {
  try {
    const { doctorId, department, date, reason, patientDetails } = req.body;

    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: "doctorId and date are required" });
    }

    if (!patientDetails || !patientDetails.name || !patientDetails.age || !patientDetails.gender) {
      return res.status(400).json({
        success: false,
        message: "Patient name, age, and gender are required",
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    // Re-check the daily cap before taking payment, so we don't charge for a day that's already full
    const queue = await getQueueStatusForDoctor(doctorId, date);
    if (queue.full) {
      return res.status(409).json({
        success: false,
        message: `This doctor is fully booked for that day (${queue.bookedCount}/${queue.capacity}). Please choose another date.`,
      });
    }

    const transactionUuid = crypto.randomUUID();
    const amount = doctor.consultationFee || 0;

    const payment = await Payment.create({
      userId: req.user.id,
      doctorId,
      department,
      date: new Date(date),
      reason,
      patientDetails,
      amount,
      transactionUuid,
      productCode: ESEWA_PRODUCT_CODE,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      transactionUuid: payment.transactionUuid,
      amount,
      // This is what the QR code encodes — opens the auto-submitting payment page
      paymentPageUrl: `${FRONTEND_URL}/pay/${payment.transactionUuid}`,
    });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// ======================
// Route: Get the signed form fields needed to redirect to eSewa
// Public (no auth) — this page may be opened on a different device via QR scan
// ======================
const getPaymentForm = async (req, res) => {
  try {
    const { transactionUuid } = req.params;
    const payment = await Payment.findOne({ transactionUuid });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment session not found" });
    }
    if (payment.status !== "pending") {
      return res.status(410).json({ success: false, message: `Payment already ${payment.status}` });
    }

    const totalAmount = payment.amount;
    const signature = generateSignature(
      totalAmount,
      payment.transactionUuid,
      payment.productCode,
      ESEWA_SECRET_KEY
    );

    return res.status(200).json({
      success: true,
      formAction: `${ESEWA_GATEWAY_URL}/api/epay/main/v2/form`,
      fields: {
        amount: totalAmount,
        tax_amount: 0,
        total_amount: totalAmount,
        transaction_uuid: payment.transactionUuid,
        product_code: payment.productCode,
        product_service_charge: 0,
        product_delivery_charge: 0,
        success_url: `${BACKEND_URL}/api/payments/esewa/success`,
        failure_url: `${BACKEND_URL}/api/payments/esewa/failure`,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature,
      },
    });
  } catch (error) {
    return errorHandler(res, error);
  }
};

// ======================
// Route: eSewa redirects here after a successful payment
// ======================
const esewaSuccess = async (req, res) => {
  try {
    const { data } = req.query;
    if (!data) {
      return res.redirect(`${FRONTEND_URL}/payment-result?status=failed`);
    }

    const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    const { transaction_uuid, total_amount, signed_field_names, signature, status } = decoded;

    const payment = await Payment.findOne({ transactionUuid: transaction_uuid });
    if (!payment) {
      return res.redirect(`${FRONTEND_URL}/payment-result?status=failed`);
    }

    // Idempotent: if we've already processed this one, just send them to the result page
    if (payment.status === "completed") {
      return res.redirect(
        `${FRONTEND_URL}/payment-result?status=success&transaction_uuid=${transaction_uuid}`
      );
    }

    // 1) Verify the signature eSewa sent us matches what we'd compute ourselves
    const expectedSignature = generateSignatureFromFields(decoded, signed_field_names, ESEWA_SECRET_KEY);
    const signatureValid = timingSafeEqual(signature, expectedSignature);

    // 2) Cross-check amount matches what we charged
    const amountValid = Number(total_amount) === Number(payment.amount);

    // 3) Defense in depth — ask eSewa's status API directly rather than trusting the redirect alone
    let statusValid = false;
    try {
      const statusRes = await fetch(
        `${ESEWA_STATUS_URL}?product_code=${payment.productCode}&total_amount=${payment.amount}&transaction_uuid=${payment.transactionUuid}`
      );
      const statusData = await statusRes.json();
      statusValid = statusData.status === "COMPLETE";
      payment.rawResponse = { redirect: decoded, statusCheck: statusData };
    } catch (e) {
      payment.rawResponse = { redirect: decoded, statusCheckError: e.message };
    }

    if (!(signatureValid && amountValid && statusValid && status === "COMPLETE")) {
      payment.status = "failed";
      await payment.save();
      return res.redirect(
        `${FRONTEND_URL}/payment-result?status=failed&transaction_uuid=${transaction_uuid}`
      );
    }

    // Payment verified — now actually book the appointment
    const bookingResult = await bookAppointment({
      userId: payment.userId,
      doctorId: payment.doctorId,
      department: payment.department,
      date: payment.date,
      reason: payment.reason,
      patientDetails: payment.patientDetails,
      bookedVia: "chatbot",
    });

    payment.status = "completed";
    payment.esewaRefId = decoded.transaction_code || decoded.ref_id || "";
    if (bookingResult.success) {
      payment.appointmentId = bookingResult.appointment._id;
    }
    await payment.save();

    if (!bookingResult.success) {
      // Payment succeeded but the slot filled up in the meantime (rare race) — flag for manual follow-up/refund
      return res.redirect(
        `${FRONTEND_URL}/payment-result?status=payment_ok_booking_failed&transaction_uuid=${transaction_uuid}`
      );
    }

    return res.redirect(
      `${FRONTEND_URL}/payment-result?status=success&transaction_uuid=${transaction_uuid}`
    );
  } catch (error) {
    console.log("eSewa success handler error:", error.message);
    return res.redirect(`${FRONTEND_URL}/payment-result?status=failed`);
  }
};

// ======================
// Route: eSewa redirects here after a failed/cancelled payment
// ======================
const esewaFailure = async (req, res) => {
  try {
    const { transaction_uuid } = req.query;
    if (transaction_uuid) {
      await Payment.findOneAndUpdate({ transactionUuid: transaction_uuid }, { status: "failed" });
    }
    return res.redirect(`${FRONTEND_URL}/payment-result?status=failed&transaction_uuid=${transaction_uuid || ""}`);
  } catch (error) {
    return res.redirect(`${FRONTEND_URL}/payment-result?status=failed`);
  }
};

// ======================
// Route: Poll payment status (used by the chatbot while waiting)
// ======================
const getPaymentStatus = async (req, res) => {
  try {
    const { transactionUuid } = req.params;
    const payment = await Payment.findOne({ transactionUuid }).populate({
      path: "appointmentId",
      populate: { path: "doctorId", populate: { path: "userId", select: "name" } },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment session not found" });
    }

    return res.status(200).json({
      success: true,
      status: payment.status,
      appointment: payment.appointmentId || null,
    });
  } catch (error) {
    return errorHandler(res, error);
  }
};

module.exports = {
  initiatePayment,
  getPaymentForm,
  esewaSuccess,
  esewaFailure,
  getPaymentStatus,
};