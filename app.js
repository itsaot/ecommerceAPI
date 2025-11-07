const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");

// -----------------------------
// Routes
// -----------------------------
const metaAdminRoutes = require("./routes/metaAdminRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes"); // Paystack

// -----------------------------
// Controllers & Middleware
// -----------------------------
const { paystackWebhookHandler } = require("./controllers/checkoutController");
const { errorHandler } = require("./middleware/errorHandler");

dotenv.config();

const app = express();

console.log("💡 Express app initialized");

// -----------------------------
// Middleware
// -----------------------------
console.log("💡 Setting up CORS");
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

console.log("💡 Setting up JSON parser");
app.use(express.json());

console.log("💡 Setting up Cookie parser");
app.use(cookieParser());

console.log("💡 Setting up Morgan logger");
app.use(morgan("dev"));

// -----------------------------
// Serve static uploads
// -----------------------------
console.log("💡 Serving uploads folder at /uploads");
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// -----------------------------
// API Routes
// -----------------------------
console.log("💡 Registering API routes");
app.use("/api/auth", authRoutes);
console.log("✅ Auth routes registered");
app.use("/api/users", userRoutes);
console.log("✅ User routes registered");
app.use("/api/admin", adminRoutes);
console.log("✅ Admin routes registered");
app.use("/api/products", productRoutes);
console.log("✅ Product routes registered");
app.use("/api/cart", cartRoutes);
console.log("✅ Cart routes registered");
app.use("/api/orders", orderRoutes);
console.log("✅ Order routes registered");
app.use("/api/checkout", checkoutRoutes);
console.log("✅ Checkout routes registered");
app.use("/api/meta-admin", metaAdminRoutes);
console.log("✅ Meta-admin routes registered");

// -----------------------------
// Paystack Webhook (raw body required)
// -----------------------------
console.log("💡 Registering Paystack webhook route");
if (!paystackWebhookHandler) {
  console.error("❌ paystackWebhookHandler is undefined!");
} else {
  console.log("✅ paystackWebhookHandler loaded");
}
app.post(
  "/api/checkout/paystack-webhook",
  express.raw({ type: "application/json" }),
  paystackWebhookHandler
);

// -----------------------------
// Error handler
// -----------------------------
console.log("💡 Setting up global error handler");
if (!errorHandler) {
  console.error("❌ errorHandler middleware is undefined!");
} else {
  console.log("✅ errorHandler loaded");
}
app.use(errorHandler);

console.log("💡 App setup complete");

module.exports = app;
