const express = require("express");
const crypto = require("crypto");
const Order = require("../models/Order");

const router = express.Router();

/**

* Paystack webhook endpoint
* NOTE:
* * Paystack sends JSON, not raw body like Stripe.
* * Signature is sent in `x-paystack-signature` header.
    */
    router.post("/", express.json(), async (req, res) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers["x-paystack-signature"];

// Verify the signature
const hash = crypto
.createHmac("sha512", secret)
.update(JSON.stringify(req.body))
.digest("hex");

if (hash !== signature) {
console.error("⚠️ Invalid Paystack signature");
return res.status(401).send("Invalid signature");
}

const event = req.body;
console.log(`📬 Paystack event received: ${event.event}`);

// Handle successful payment event
if (event.event === "charge.success") {
const data = event.data;
const orderId = data.metadata?.orderId;


if (orderId) {
  try {
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "paid",
      paymentReference: data.reference,
      updatedAt: new Date(),
    });
    console.log(`✅ Order ${orderId} marked as paid`);
  } catch (err) {
    console.error("❌ Error updating order:", err);
  }
}


}

// Respond immediately to acknowledge receipt
res.status(200).json({ received: true });
});

module.exports = router;
