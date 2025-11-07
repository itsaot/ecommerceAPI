const Paystack = require('paystack-api')(
process.env.PAYSTACK_SECRET_KEY
);
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendEmail');

// Initialize payment and create order
exports.createPayment = async (req, res) => {
try {
const { shippingAddress } = req.body;
const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
if (!cart || cart.items.length === 0)
return res.status(400).json({ message: 'Cart empty' });

// calculate total amount in kobo
const amount = Math.round(
  cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0) * 100
);

// create order with pending status
const order = await Order.create({
  user: req.user._id,
  items: cart.items.map(i => ({
    product: i.product._id,
    name: i.product.name,
    price: i.product.price,
    quantity: i.quantity
  })),
  shippingAddress,
  total: amount / 100,
  paymentStatus: 'pending'
});

// initialize Paystack transaction
const response = await Paystack.transaction.initialize({
  email: req.user.email,
  amount,
  metadata: { orderId: order._id.toString() },
  callback_url: `${process.env.CLIENT_URL}/checkout/success`
});

res.json({ url: response.data.authorization_url });

} catch (err) {
console.error(err);
res.status(500).json({ message: 'Payment initialization failed' });
}
};

// Paystack webhook handler
exports.paystackWebhookHandler = async (req, res) => {
const hash = req.headers['x-paystack-signature'];
const secret = process.env.PAYSTACK_WEBHOOK_SECRET;

// verify signature
const computedHash = crypto
.createHmac('sha512', secret)
.update(JSON.stringify(req.body))
.digest('hex');

if (hash !== computedHash) return res.status(400).send('Invalid signature');

const event = req.body;

if (event.event === 'charge.success') {
const metadata = event.data.metadata;
const orderId = metadata.orderId;

// mark order as paid
const order = await Order.findByIdAndUpdate(
  orderId,
  {
    paymentStatus: 'paid',
    paymentIntentId: event.data.reference,
    updatedAt: Date.now()
  },
  { new: true }
);

// clear user's cart
await Cart.findOneAndDelete({ user: order.user });

// send confirmation email
try {
  await sendEmail({
    to: event.data.customer.email,
    subject: 'Order confirmed',
    html: `<p>Thanks! Your order ${order._id} has been confirmed.</p>`
  });
} catch (e) {
  console.warn('Failed to send order email', e.message);
}

}

res.json({ received: true });
};