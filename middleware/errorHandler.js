// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error("💥 Global Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = { errorHandler };
