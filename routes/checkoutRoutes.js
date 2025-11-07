const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const { auth } = require("../middleware/auth");

// Create Paystack transaction
router.post("/paystack", auth, checkoutController.createPaystackPayment);

// ⚠️ Webhook route will be mounted separately in app.js with express.raw()
// router.post("/paystack-webhook", express.raw({ type: "application/json" }), checkoutController.paystackWebhookHandler);

module.exports = router;
