const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const { auth } = require("../middleware/auth");

// Protected route to create Paystack payment
router.post("/paystack", auth, checkoutController.createPaystackPayment);

module.exports = router;
