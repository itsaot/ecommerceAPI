const Paystack = require("paystack-node");
const crypto = require("crypto");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const sendEmail = require("../utils/sendEmail");

// Initialize Paystack
const paystack = new Paystack(
  process.env.PAYSTACK_SECRET_KEY,
  process.env.NODE_ENV === "production"
);

// Create Paystack payment
exports.createPaystackPayment = async (req, res) => {
  try {
    const { items, customerEmail, shippingAddress, userId } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: "Cart empty" });

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

    const totalAmount = Math.round(
      detailedItems.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100
    );

    const order = await Order.create({
      user: userId,
      items: detailedItems,
      shippingAddress,
      total: totalAmount / 100,
      paymentStatus: "pending",
    });

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
};

// Paystack webhook
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
        const order = await Order.findByIdAndUpdate(
          orderId,
          {
            paymentStatus: "paid",
            paymentIntentId: reference,
            updatedAt: Date.now(),
          },
          { new: true }
        );

        await Cart.findOneAndDelete({ user: order.user });

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
};
