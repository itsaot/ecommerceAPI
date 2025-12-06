const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

/* -------------------------------------------------------
   CREATE ORDER (USER)
   Usually called after Paystack session is created
------------------------------------------------------- */
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, total, paystackReference } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items provided' });
    }

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
    await User.findByIdAndUpdate(req.user._id, {
      $push: { orders: order._id }
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err.message);
    res.status(500).json({ message: 'Order creation failed', error: err.message });
  }
};

/* -------------------------------------------------------
   GET ALL ORDERS (USER)
------------------------------------------------------- */
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('items.productId') // <-- use productId
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Get user orders error:', err);
    res.status(500).json({ message: 'Failed to load orders', error: err.message });
  }
};


/* -------------------------------------------------------
   GET SINGLE ORDER (USER)
------------------------------------------------------- */
exports.getOrder = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userRole = req.user?.role;

    let orders;
    
    // Admin and meta-admin can see all orders
    if (userRole === 'admin' || userRole === 'meta-admin') {
      orders = await Order.find()
        .sort({ createdAt: -1 })
        .populate('userId', 'email firstName lastName');
    } else {
      // Regular users only see their own orders
      orders = await Order.find({ userId })
        .sort({ createdAt: -1 });
    }

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error.message);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

/* -------------------------------------------------------
   GET ALL ORDERS (ADMIN)
------------------------------------------------------- */
exports.adminGetOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'firstName lastName email') // use correct User fields
      .populate('items.productId') // <-- fixed
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Admin get orders error:', err);
    res.status(500).json({ message: 'Failed to fetch all orders', error: err.message });
  }
};


/* -------------------------------------------------------
   UPDATE PAYMENT STATUS (ADMIN)
------------------------------------------------------- */
exports.adminUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: status, updatedAt: Date.now() },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (err) {
    console.error('Admin update order status error:', err.message);
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};
