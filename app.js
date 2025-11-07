const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");

// Routes
const metaAdminRoutes = require("./routes/metaAdminRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes"); // Paystack

const { errorHandler } = require("./middleware/errorHandler");

dotenv.config();

const app = express();

// -----------------------------
// Middleware
// -----------------------------
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// -----------------------------
// Serve static uploads
// -----------------------------
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// -----------------------------
// API Routes
// -----------------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/meta-admin", metaAdminRoutes);

// -----------------------------
// Error handler
// -----------------------------
app.use(errorHandler);

module.exports = app;
