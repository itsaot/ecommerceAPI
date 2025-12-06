const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

/* -------------------------------------------------------
   USER: CREATE ORDER
   Usually called after Paystack session is created,
   but you can keep this if you allow server-side order creation.
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
   USER: GET ALL MY ORDERS
------------------------------------------------------- */
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Get user orders error:', err.message);
    res.status(500).json({ message: 'Failed to load orders', error: err.message });
  }
};

/* -------------------------------------------------------
   USER: GET ONE ORDER
------------------------------------------------------- */
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('items.product');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (err) {
    console.error('Get order error:', err.message);
    res.status(500).json({ message: 'Failed to fetch order', error: err.message });
  }
};

/* -------------------------------------------------------
   ADMIN: GET ALL ORDERS
------------------------------------------------------- */
exports.adminGetOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error('Admin get orders error:', err.message);
    res.status(500).json({ message: 'Failed to fetch all orders', error: err.message });
  }
};

/* -------------------------------------------------------
   ADMIN: UPDATE PAYMENT STATUS
   Useful for manual adjustments
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
    console.error('Admin update order status error:', err.message);
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};

/* -------------------------------------------------------
   GET ORDERS BASED ON ROLE (optional combined endpoint)
------------------------------------------------------- */
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let orders;
    if (role === 'admin' || role === 'meta-admin') {
      orders = await Order.find()
        .sort({ createdAt: -1 })
        .populate('userId', 'name email')
        .populate('items.product');
    } else {
      orders = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .populate('items.product');
    }

    res.json(orders);
  } catch (err) {
    console.error('Get orders error:', err.message);
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};
