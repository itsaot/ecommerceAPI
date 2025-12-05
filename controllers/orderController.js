const Order = require('../models/Order');
const User = require('../models/User');

/* -------------------------------------------------------
   CREATE ORDER
------------------------------------------------------- */
exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create({
      user: req.user._id,
      items: req.body.items,                     // [{ product, name, price, quantity }]
      shippingAddress: req.body.shippingAddress, // matches schema
      total: req.body.total,
      currency: req.body.currency || "ZAR",
      paymentStatus: "pending",
      paystackReference: req.body.paystackReference, // generated ref
      createdAt: Date.now(),
    });

    // sync with user
    await User.findByIdAndUpdate(req.user._id, {
      $push: { orders: order._id }
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "Order creation failed", error: err.message });
  }
};

/* -------------------------------------------------------
   USER: GET ALL MY ORDERS
------------------------------------------------------- */
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to load orders", error: err.message });
  }
};

/* -------------------------------------------------------
   USER: GET ONE ORDER
------------------------------------------------------- */
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate("items.product");

    if (!order) return res.status(404).json({ message: "Not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order", error: err.message });
  }
};

/* -------------------------------------------------------
   ADMIN: GET ALL ORDERS
------------------------------------------------------- */
exports.adminGetOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch all orders", error: err.message });
  }
};

/* -------------------------------------------------------
   ADMIN: UPDATE PAYMENT STATUS
------------------------------------------------------- */
exports.adminUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: status, updatedAt: Date.now() },
      { new: true }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};
