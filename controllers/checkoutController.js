const stripe = require('stripe')(process.env.STRIPE_SECRET);
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendEmail');

exports.createCheckoutSession = async (req, res) => {
  const { shippingAddress } = req.body;
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Cart empty' });

  // compute line_items server-side
  const line_items = cart.items.map(i => ({
    price_data: {
      currency: 'zar',
      product_data: { name: i.product.name, description: i.product.description || '' },
      unit_amount: Math.round(i.product.price * 100)
    },
    quantity: i.quantity
  }));

  // Create order in DB with pending status
  const order = await Order.create({
    user: req.user._id,
    items: cart.items.map(i => ({ product: i.product._id, name: i.product.name, price: i.product.price, quantity: i.quantity })),
    shippingAddress,
    total: cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0),
    paymentStatus: 'pending'
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items,
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/checkout/cancel`,
    metadata: { orderId: order._id.toString() },
    customer_email: req.user.email
  });

  res.json({ url: session.url });
};

// Webhook handler. Note: server.js mounts this route with raw body.
exports.stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.orderId;
    // mark order paid
    const order = await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      paymentIntentId: session.payment_intent,
      updatedAt: Date.now()
    }, { new: true });

    // clear user's cart
    await Cart.findOneAndDelete({ user: order.user });

    // send confirmation email
    try {
      await sendEmail({
        to: session.customer_email,
        subject: 'Order confirmed',
        html: `<p>Thanks! Your order ${order._id} has been confirmed.</p>`
      });
    } catch (e) { console.warn('Failed to send order email', e.message); }
  }

  res.json({ received: true });
};
