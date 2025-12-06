// app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");

// Controllers
const { paystackWebhookHandler } = require("./controllers/checkoutController");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const metaAdminRoutes = require("./routes/metaAdminRoutes");
const categoryRoutes = require("./routes/categoriesRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();

// ----------------------------
// CORS Setup
// ----------------------------
const whitelist = [
  ...(process.env.CORS_WHITELIST?.split(",").map(url => url.trim()) || []),
  process.env.CLIENT_URL,
  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (whitelist.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
};

app.use(cors(corsOptions));

// ----------------------------
// Middleware
// ----------------------------
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ----------------------------
// Paystack Webhook (raw body)
// ----------------------------
app.post(
  "/api/checkout/paystack-webhook",
  express.raw({ type: "application/json" }),
  paystackWebhookHandler
);

// ----------------------------
// ROUTES
// ----------------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/meta-admin", metaAdminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/contact", contactRoutes);

// ----------------------------
// Global Error Handler
// ----------------------------
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Server Error",
  });
});

module.exports = app;
