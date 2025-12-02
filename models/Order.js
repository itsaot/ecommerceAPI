const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,   // snapshot at purchase time
    quantity: Number
  }],

  shippingAddress: Object,

  total: Number,
  currency: { type: String, default: 'ZAR' },

  paymentStatus: { 
    type: String, 
    enum: ['pending','paid','failed','refunded'], 
    default: 'pending' 
  },

  // ⭐ Paystack fields
  paystackReference: String,     // Your generated reference
  transactionId: String,         // Paystack trans id after verification
  gatewayResponse: String,       // paystack response (optional)

  // Email receipt
  receipt: {
    html: String,
    sentAt: Date
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

module.exports = mongoose.model('Order', orderSchema);
