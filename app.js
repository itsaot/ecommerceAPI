const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");

// Load environment variables
dotenv.config();

// -----------------------------
// Import routes
// -----------------------------
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const metaAdminRoutes = require("./routes/metaAdminRoutes");

// Import Paystack webhook handler
const { paystackWebhookHandler } = require("./controllers/checkoutController");

// Import global error handler
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
console.log("💡 Express app initialized");

// -----------------------------
// CORS Setup
// -----------------------------
console.log("💡 Setting up CORS");

// Dynamic whitelist from .env (comma-separated) + common dev URLs
const whitelist = [
  ...(process.env.CORS_WHITELIST?.split(",").map(url => url.trim()) || []),
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "https://preview--ecom-opus-palette.lovable.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

app.use(cors(corsOptions));

// -----------------------------
// Middleware
// -----------------------------
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
// Paystack webhook should bypass JSON/body parsers and CORS
app.post(
  "/api/checkout/paystack-webhook",
  express.raw({ type: "application/json" }),
  paystackWebhookHandler
);
console.log("✅ paystackWebhookHandler loaded");

// -----------------------------
// Catch CORS errors
// -----------------------------
app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "CORS Error: Origin not allowed" });
  }
  next(err);
});

// -----------------------------
// Global Error Handler
// -----------------------------
console.log("💡 Setting up global error handler");
app.use(errorHandler);
console.log("✅ errorHandler loaded");

console.log("💡 App setup complete");

// -----------------------------
// Start Server
// -----------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;
