const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, unique: true, index: true },

    name: { type: String, required: true },
    description: String,

    price: { type: Number, required: true }, // in Rands
    currency: { type: String, default: "ZAR" },

    stock: { type: Number, default: 0 },

    categories: [String],

    images: [{ url: String }],

    specs: mongoose.Schema.Types.Mixed,

    // ⭐ SPECIALS
    special: {
      isActive: { type: Boolean, default: false },
      discountPercentage: { type: Number, default: 0 },

      startDate: { type: Date },
      endDate: { type: Date },

      // ⭐ This field was missing — it caused the frontend to break
      specialPrice: { type: Number, default: null },
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true }
);

/* -------------------------------------------------------
   AUTO CHECK & UPDATE SPECIAL STATUS
------------------------------------------------------- */
productSchema.methods.checkAndUpdateSpecial = function () {
  const now = new Date();

  if (this.special.startDate && this.special.endDate) {
    this.special.isActive =
      now >= this.special.startDate && now <= this.special.endDate;
  } else {
    this.special.isActive = false;
  }

  return this.special.isActive;
};

/* -------------------------------------------------------
   AUTO-COMPUTE SPECIAL PRICE
------------------------------------------------------- */
productSchema.methods.computeSpecialPrice = function () {
  if (
    this.special &&
    this.special.isActive &&
    this.special.discountPercentage > 0
  ) {
    const discount = this.special.discountPercentage;

    this.special.specialPrice = Math.round(
      this.price * ((100 - discount) / 100)
    );
  } else {
    // Ensure frontend ALWAYS receives a fallback number
    this.special.specialPrice = this.price;
  }
};

/* -------------------------------------------------------
   PRE-SAVE HOOK
------------------------------------------------------- */
productSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  this.checkAndUpdateSpecial();
  this.computeSpecialPrice();

  next();
});

module.exports = mongoose.model("Product", productSchema);
