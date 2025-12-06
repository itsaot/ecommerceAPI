const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');

/* -------------------------------------------------------
   CREATE ORDER (USER)
------------------------------------------------------- */
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, total, paystackReference } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ message: 'No items provided' });

    const order = await Order.create({
      userId: req.user._id,
      items: items.map(i => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      shippingAddress,
      total,
      paymentStatus: 'pending',
      paymentReference: paystackReference,
      status: 'pending',
      createdAt: Date.now(),
    });

    // Add order reference to user
    await User.findByIdAndUpdate(req.user._id, { $push: { orders: order._id } });

    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err.message);
    res.status(500).json({ message: 'Order creation failed', error: err.message });
  }
};

/* -------------------------------------------------------
   GET ALL ORDERS FOR LOGGED-IN USER
------------------------------------------------------- */
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('items.productId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Get user orders error:', err.message);
    res.status(500).json({ message: 'Failed to load orders', error: err.message });
  }
};

/* -------------------------------------------------------
   GET SINGLE ORDER
------------------------------------------------------- */
exports.getOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId))
      return res.status(400).json({ message: 'Invalid order ID' });

    let order;
    if (req.user.role === 'admin' || req.user.role === 'meta-admin') {
      order = await Order.findById(orderId).populate('items.productId').populate('userId', 'firstName lastName email');
    } else {
      order = await Order.findOne({ _id: orderId, userId: req.user._id }).populate('items.productId');
    }

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (err) {
    console.error('Get order error:', err.message);
    res.status(500).json({ message: 'Failed to fetch order', error: err.message });
  }
};

/* -------------------------------------------------------
   GET ALL ORDERS (ADMIN)
------------------------------------------------------- */
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.productId')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Get all orders error:', err.message);
    res.status(500).json({ message: 'Failed to fetch all orders', error: err.message });
  }
};

/* -------------------------------------------------------
   UPDATE PAYMENT STATUS (ADMIN)
   PUT /api/orders/admin/:id/status
------------------------------------------------------- */
exports.adminUpdateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`Invalid order ID: ${id}`);
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    if (!status) {
      console.warn('No status provided in request body');
      return res.status(400).json({ message: 'Status is required' });
    }

    // Update the order
    const order = await Order.findByIdAndUpdate(
      id,
      { paymentStatus: status, updatedAt: Date.now() },
      { new: true }
    ).populate('userId', 'firstName lastName email').populate('items.productId');

    if (!order) {
      console.warn(`Order not found: ${id}`);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log(`Order ${id} updated to status: ${status}`);
    res.json({ message: 'Order status updated successfully', order });
  } catch (err) {
    console.error('Admin update order status error:', err);
    res.status(500).json({ message: 'Failed to update order status', error: err.message });
  }
};
