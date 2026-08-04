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
const isAdmin = require("../middleware/isAdmin"); 

router.post("/esewa/initiate", verifyUser, initiateEsewaPayment);
router.post("/esewa/verify", verifyUser, verifyEsewaPayment);
router.get("/my-payments", verifyUser, getMyPayments);


router.get("/issues", verifyUser, isAdmin, getPaymentIssues);
router.post("/:transactionUuid/retry-booking", verifyUser, isAdmin, retryFailedBooking);

module.exports = router;