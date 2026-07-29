const express = require("express");
const router = express.Router();
const {
  initiateEsewaPayment,
  verifyEsewaPayment,
  getMyPayments,
  getPaymentIssues,
  retryFailedBooking,
} = require("../controller/paymentController");

const verifyUser = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin"); // create this — see isAdmin_middleware.js from earlier

router.post("/esewa/initiate", verifyUser, initiateEsewaPayment);
router.post("/esewa/verify", verifyUser, verifyEsewaPayment);
router.get("/my-payments", verifyUser, getMyPayments);

// Admin-only — see the isAdmin caveat: confirm your JWT payload/User
// schema actually has a `role` field before this does anything meaningful.
router.get("/issues", verifyUser, isAdmin, getPaymentIssues);
router.post("/:transactionUuid/retry-booking", verifyUser, isAdmin, retryFailedBooking);

module.exports = router;