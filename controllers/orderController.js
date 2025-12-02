const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create({
      user: req.user._id,
      items: req.body.items,
      amount: req.body.amount,
      paymentStatus: 'pending',
      paymentMethod: req.body.paymentMethod,
      address: req.body.address,
      createdAt: Date.now(),
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Order creation failed', error: err.message });
  }
};


exports.getUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

exports.getOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: 'Not found' });
  res.json(order);
};

exports.adminGetOrders = async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
};

exports.adminUpdateStatus = async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus: status, updatedAt: Date.now() }, { new: true });
  res.json(order);
};
