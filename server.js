// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require("node-cron");
const Product = require("./models/Product");

const connectDB = require('./config/db');
const { stripeWebhookHandler } = require('./controllers/checkoutController');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL, // or '*' for testing
  credentials: true
}));
// Stripe webhook requires raw body for signature verification — mount BEFORE express.json for that route
app.post('/api/checkout/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// regular JSON parser after webhook
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to connect DB', err);
});

// Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("🕒 Checking product specials...");

  try {
    const products = await Product.find();

    for (const product of products) {
      const now = new Date();
      const { startDate, endDate } = product.special || {};
      let updated = false;

      if (startDate && endDate) {
        const shouldBeActive = now >= startDate && now <= endDate;
        if (product.special.isActive !== shouldBeActive) {
          product.special.isActive = shouldBeActive;
          updated = true;
        }
      }

      // If special was removed or dates not set, ensure inactive
      if ((!startDate || !endDate) && product.special.isActive) {
        product.special.isActive = false;
        updated = true;
      }

      if (updated) {
        await product.save();
        console.log(
          `${product.name}: special ${
            product.special.isActive ? "activated ✅" : "expired ❌"
          }`
        );
      }
    }
  } catch (err) {
    console.error("Error updating product specials:", err);
  }
});
// server.js

