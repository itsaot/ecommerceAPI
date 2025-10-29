// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, unique: true, index: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true }, // in cents or Rands, your choice
    currency: { type: String, default: "ZAR" },
    stock: { type: Number, default: 0 },
    categories: [String],
    // ✅ Store local image paths (e.g. "/uploads/product123.jpg")
    images: [{ url: String }], 
    specs: mongoose.Schema.Types.Mixed, // key-value engineering specs

    // ✅ Specials section (timed discounts)
    special: {
      isActive: { type: Boolean, default: false },
      discountPercentage: { type: Number, default: 0 }, // e.g., 10 = 10% off
      startDate: { type: Date },
      endDate: { type: Date },
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true }
);

// Automatically check & update special based on date/time
productSchema.methods.checkAndUpdateSpecial = function () {
  const now = new Date();
  if (this.special.startDate && this.special.endDate) {
    if (now >= this.special.startDate && now <= this.special.endDate) {
      this.special.isActive = true;
    } else {
      this.special.isActive = false;
    }
  }
  return this.special.isActive;
};

// Optional: pre-save hook to auto-update `updatedAt`
productSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Product", productSchema);
