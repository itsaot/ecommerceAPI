// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number, // snapshot
    quantity: Number
  }],
  shippingAddress: Object,
  total: Number,
  currency: { type: String, default: 'ZAR' },
  paymentStatus: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  paymentIntentId: String, // Stripe checkout session / paymentIntent id
  receipt: {
    html: String,        // store the email HTML content
    sentAt: Date         // timestamp when sent
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

module.exports = mongoose.model('Order', orderSchema);
