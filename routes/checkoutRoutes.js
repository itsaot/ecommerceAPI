import express from "express";
import Stripe from "stripe";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET);

// Create Stripe checkout session
router.post("/", async (req, res) => {
  try {
    const { items, customerEmail } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Build line items for Stripe
    const line_items = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) throw new Error("Product not found");

        return {
          price_data: {
            currency: product.currency || "ZAR",
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.price, // price in cents
          },
          quantity: item.quantity,
        };
      })
    );

    // Create order in DB (pending payment)
    const order = await Order.create({
      items,
      customerEmail,
      paymentStatus: "pending",
      total: line_items.reduce((sum, li) => sum + li.price_data.unit_amount * li.quantity, 0),
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      customer_email: customerEmail,
      metadata: { orderId: order._id.toString() }, // attach order ID
      success_url: `${process.env.CLIENT_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout-cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("💥 Stripe checkout error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

export default router;
