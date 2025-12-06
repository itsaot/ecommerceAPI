const express = require("express");
const router = express.Router();
const checkout = require("../controllers/checkoutController");

// This matches frontend: payments.createSession
router.post("/create-session", checkout.createPaystackPayment);

// This matches frontend: payments.process
// For Paystack you DON’T need to process cards manually.
// Paystack handles everything on their hosted page.
router.post("/process", (req, res) => {
  return res.json({
    success: true,
    message: "Paystack handles card processing automatically",
    note: "No server-side card processing required"
  });
});

module.exports = router;
