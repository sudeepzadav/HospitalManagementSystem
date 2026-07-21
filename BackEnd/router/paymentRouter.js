const express = require("express");
const router = express.Router();

const verifyUser = require("../middleware/auth");

const {
  initiatePayment,
  getPaymentForm,
  esewaSuccess,
  esewaFailure,
  getPaymentStatus,
} = require("../controller/paymentController");

// Start a payment session for an upcoming appointment (requires login)
router.post("/initiate", verifyUser, initiatePayment);

// Get signed eSewa form fields — public, may be opened on a different device via QR
router.get("/form/:transactionUuid", getPaymentForm);

// eSewa redirects here after payment completes or fails
router.get("/esewa/success", esewaSuccess);
router.get("/esewa/failure", esewaFailure);

// Poll payment status (used by the chatbot while waiting for the user to pay)
router.get("/status/:transactionUuid", getPaymentStatus);

module.exports = router;