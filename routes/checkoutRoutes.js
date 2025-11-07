const express = require("express");
const Paystack = require("paystack-node");
const crypto = require("crypto");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

// Initialize Paystack client
const paystack = new Paystack(
  process.env.PAYSTACK_SECRET_KEY,
  process.env.NODE_ENV === "production" // true = live, false = test
);

/**
 * @desc Create Paystack transaction and order
 * @route POST /api/checkout/paystack
 */
router.post("/paystack", async (req, res) => {
  try {
    const { items, customerEmail, shippingAddress, userId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart empty" });
    }

    // Build detailed cart items
    const detailedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) throw new Error("Product not found");
      detailedItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });
    }

    // Calculate total in kobo (Paystack expects kobo)
    const totalAmount = Math.round(
      detailedItems.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100
    );

    // Create pending order
    const order = await Order.create({
      user: userId,
      items: detailedItems,
      shippingAddress,
      total: totalAmount / 100,
      paymentStatus: "pending",
    });

    // Initialize Paystack transaction
    const response = await paystack.initializeTransaction({
      email: customerEmail,
      amount: totalAmount,
      callback_url: `${process.env.CLIENT_URL}/checkout-success`,
      metadata: { orderId: order._id.toString() },
    });

    res.json({ url: response.data.authorization_url });
  } catch (err) {
    console.error("💥 Paystack checkout error:", err.message);
    res.status(500).json({ message: "Payment initialization failed" });
  }
});

/**
 * @desc Paystack Webhook Handler
 * @route POST /api/checkout/paystack-webhook
 * ⚠️ Must not be protected by auth
 */
router.post(
  "/paystack-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      const hash = req.headers["x-paystack-signature"];

      const computedHash = crypto
        .createHmac("sha512", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (hash !== computedHash) return res.status(400).send("Invalid signature");

      const event = req.body;

      if (event.event === "charge.success") {
        const { metadata, customer, reference } = event.data;
        const orderId = metadata?.orderId;

        if (orderId) {
          const order = await Order.findByIdAndUpdate(
            orderId,
            {
              paymentStatus: "paid",
              paymentIntentId: reference,
              updatedAt: Date.now(),
            },
            { new: true }
          );

          // Clear user's cart
          await Cart.findOneAndDelete({ user: order.user });

          // Send confirmation email
          try {
            await sendEmail({
              to: customer.email,
              subject: "Order confirmed",
              html: `<p>Thanks! Your order ${order._id} has been confirmed.</p>`,
            });
          } catch (e) {
            console.warn("Failed to send order email", e.message);
          }

          console.log(`✅ Order ${orderId} paid successfully by ${customer.email}`);
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error.message);
      res.status(500).json({ message: "Webhook handling failed" });
    }
  }
);

module.exports = router;
