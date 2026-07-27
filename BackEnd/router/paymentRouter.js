const express = require("express");
const router = express.Router();
const {
  initiateEsewaPayment,
  verifyEsewaPayment,
} = require("../controller/paymentController");
// Adjust this path if verifyUser.js lives somewhere else.
const verifyUser = require("../middleware/auth");

// Mounted in index.js as: app.use("/api/payments", paymentRouter)
// so these resolve to /api/payments/esewa/initiate and /api/payments/esewa/verify
// — matching what Payment.jsx and PaymentSuccess.jsx already call.
router.post("/esewa/initiate", verifyUser, initiateEsewaPayment);
router.post("/esewa/verify", verifyUser, verifyEsewaPayment);

module.exports = router;