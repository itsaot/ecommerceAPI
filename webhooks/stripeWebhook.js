// webhooks/stripeWebhook.js
import express from "express";
import Stripe from "stripe";
import Order from "../models/Order.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET);

// Stripe sends raw body for signature verification
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle successful checkout
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: "paid",
          paymentIntentId: session.payment_intent,
          updatedAt: new Date(),
        });
        console.log(`✅ Order ${orderId} marked as paid`);
      }
    }

    res.json({ received: true });
  }
);

export default router;
