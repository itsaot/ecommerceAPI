const Order = require("../models/Order");
const Payment = require("../models/Payment");
const paystack = require("../utils/paystack"); // Your Paystack lib
const Product = require("../models/Product");


// Create a Paystack payment session
exports.createSession = async (req, res) => {
  try {
    const { items, customerEmail, shippingAddress, userId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Build detailed order items
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
    ); // in kobo

    // Create order
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
      callback_url: `${process.env.CLIENT_URL}/payment-success`,
      metadata: { orderId: order._id.toString() },
    });

    res.json({ url: response.data.authorization_url });
  } catch (err) {
    console.error("💥 Paystack checkout error:", err.message);
    res.status(500).json({ message: "Payment initialization failed" });
  }
};

// Verify Paystack payment
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params; // instead of req.body

    const response = await paystack.verifyTransaction(reference);
    if (!response.data) return res.status(404).json({ message: "Transaction not found" });

    const metadata = response.data.metadata;
    const order = await Order.findById(metadata.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentStatus = response.data.status === "success" ? "paid" : "failed";
    await order.save();

    res.json({ message: "Payment verified", order });
  } catch (err) {
    console.error("💥 Paystack verify error:", err);
    res.status(500).json({ message: "Payment verification failed" });
  }
};
