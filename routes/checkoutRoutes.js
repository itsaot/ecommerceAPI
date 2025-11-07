const express = require("express");
const Stripe = require("stripe");
const Order = require("../models/Order");
const Product = require("../models/Product");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET);

// Create Stripe checkout session
router.post("/", async (req, res) => {
try {
const { items, customerEmail } = req.body;


if (!items || !Array.isArray(items) || items.length === 0) {
  return res.status(400).json({ message: "Cart is empty or invalid" });
}

// Build line items for Stripe
const line_items = await Promise.all(
  items.map(async (item) => {
    const product = await Product.findById(item.productId);
    if (!product) throw new Error(`Product not found: ${item.productId}`);

    return {
      price_data: {
        currency: product.currency || "usd",
        product_data: {
          name: product.name,
          description: product.description || "",
        },
        unit_amount: Math.round(product.price * 100), // Stripe expects cents
      },
      quantity: item.quantity,
    };
  })
);

// Create order in DB (pending payment)
const totalAmount = line_items.reduce(
  (sum, li) => sum + li.price_data.unit_amount * li.quantity,
  0
);

const order = await Order.create({
  items,
  customerEmail,
  paymentStatus: "pending",
  total: totalAmount,
});

// Create Stripe checkout session
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  line_items,
  mode: "payment",
  customer_email: customerEmail,
  metadata: { orderId: order._id.toString() },
  success_url: `${process.env.CLIENT_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.CLIENT_URL}/checkout-cancel`,
});

res.json({ url: session.url });

} catch (err) {
console.error("💥 Stripe checkout error:", err);
res.status(500).json({ message: err.message });
}
});

module.exports = router;
