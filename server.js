require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require("node-cron");
const path = require("path");

const connectDB = require('./config/db');
const Product = require("./models/Product");
const { paystackWebhookHandler } = require('./controllers/checkoutController');

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoriesRoutes');
const contactRoutes = require("./routes/contactRoutes");



const app = express();

// -----------------------------
// Basic Logs
// -----------------------------
console.log("💡 Express app initialized");

// -----------------------------
// Middleware
// -----------------------------
console.log("💡 Setting up CORS");
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

console.log("💡 Mounting Paystack webhook route (raw body)");
app.post('/api/checkout/paystack-webhook', express.raw({ type: 'application/json' }), paystackWebhookHandler);

console.log("💡 Setting up JSON parser");
app.use(express.json());

console.log("💡 Setting up Cookie parser");
app.use(cookieParser());

// Serve static uploads
console.log("💡 Serving uploads folder at /uploads");
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// -----------------------------
// Mount Routes
// -----------------------------
console.log("💡 Mounting Auth routes");
app.use('/api/auth', authRoutes);
console.log("✅ Auth routes mounted");

console.log("💡 Mounting Product routes");
app.use('/api/products', productRoutes);
console.log("✅ Product routes mounted");

console.log("💡 Mounting Cart routes");
app.use('/api/cart', cartRoutes);
console.log("✅ Cart routes mounted");

console.log("💡 Mounting Order routes");
app.use('/api/orders', orderRoutes);
console.log("✅ Order routes mounted");

console.log("💡 Mounting Admin routes");
app.use('/api/admin', adminRoutes);
console.log("✅ Admin routes mounted");

console.log("💡 Mounting User routes");
app.use('/api/users', userRoutes);
console.log("✅ User routes mounted");

app.use('/api/categories', categoryRoutes);
app.use("/api/contact", contactRoutes);


// -----------------------------
// Error handler
// -----------------------------
console.log("💡 Setting up global error handler");
app.use((err, req, res, next) => {
  console.error("❌ Global error handler caught:", err);
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});
console.log("✅ Global error handler mounted");

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ Failed to connect to DB:', err));

// -----------------------------
// Cron Job to update product specials every 5 minutes
// -----------------------------
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

      if ((!startDate || !endDate) && product.special.isActive) {
        product.special.isActive = false;
        updated = true;
      }

      if (updated) {
        await product.save();
        console.log(
          `${product.name}: special ${product.special.isActive ? "activated ✅" : "expired ❌"}`
        );
      }
    }
  } catch (err) {
    console.error("❌ Error updating product specials:", err);
  }
});

