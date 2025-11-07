require('dotenv').config();
const Paystack = require("paystack-node");
const crypto = require("crypto");
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendEmail');

// Initialize Paystack client
const paystack = new Paystack(
  process.env.PAYSTACK_SECRET_KEY,
  process.env.NODE_ENV === "production" // true = live, false = test
);

// ------------------------
// PAYSTACK PAYMENT
// ------------------------

exports.createPaystackPayment = async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Cart empty' });

    // Build detailed cart items
    const detailedItems = cart.items.map(i => ({
      product: i.product._id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity
    }));

    // Calculate total in kobo
    const totalAmount = Math.round(cart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0) * 100);

    // Create order in DB (pending)
    const order = await Order.create({
      user: req.user._id,
      items: detailedItems,
      shippingAddress,
      total: totalAmount / 100,
      paymentStatus: 'pending'
    });

    // Initialize Paystack transaction
    const response = await paystack.initializeTransaction({
      email: req.user.email,
      amount: totalAmount,
      callback_url: `${process.env.CLIENT_URL}/checkout-success`,
      metadata: { orderId: order._id.toString() }
    });

    res.json({ url: response.data.authorization_url });
  } catch (err) {
    console.error('💥 Paystack checkout error:', err.message);
    res.status(500).json({ message: 'Payment initialization failed' });
  }
};

// Paystack Webhook
exports.paystackWebhookHandler = async (req, res) => {
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
        const order = await Order.findByIdAndUpdate(orderId, {
          paymentStatus: "paid",
          paymentIntentId: reference,
          updatedAt: Date.now()
        }, { new: true });

        // Clear user's cart
        await Cart.findOneAndDelete({ user: order.user });

        // Send confirmation email
        try {
          await sendEmail({
            to: customer.email,
            subject: 'Order confirmed',
            html: `<p>Thanks! Your order ${order._id} has been confirmed.</p>`
          });
        } catch (e) {
          console.warn('Failed to send order email', e.message);
        }
      }

      console.log(`✅ Order ${orderId} paid successfully by ${customer.email}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(500).json({ message: "Webhook handling failed" });
  }
};
