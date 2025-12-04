const Product = require('../models/Product');

/* -------------------------------------------------------
   Utility: Compute special price if active
------------------------------------------------------- */
function computeSpecialPrice(product) {
  if (
    product.special &&
    product.special.isActive &&
    product.special.discountPercentage > 0
  ) {
    const discount = product.special.discountPercentage;
    product.special.specialPrice = Math.round(
      (product.price * (100 - discount)) / 100
    );
  } else {
    // Always return a numeric fallback so frontend never breaks
    product.special = {
      ...product.special,
      specialPrice: product.price,
    };
  }
}


/* -------------------------------------------------------
   CREATE PRODUCT
------------------------------------------------------- */
exports.createProduct = async (req, res) => {
  try {
    let { name, description, price, categories, stock, images, special } = req.body;

    // Validate required fields
    if (!name || !description || price === undefined) {
      return res.status(400).json({ message: "Name, description, and price are required" });
    }

    // Convert numbers
    price = Number(price);
    if (isNaN(price)) return res.status(400).json({ message: "Price must be a number" });
    stock = stock ? Number(stock) : 0;

    // Normalize categories
    if (!categories) categories = [];
    categories = Array.isArray(categories) ? categories : [categories];

    // Normalize images
    let formattedImages = [];
    if (images) {
      if (Array.isArray(images)) {
        formattedImages = images.filter(Boolean).map(url => ({ url }));
      } else if (typeof images === "string") {
        formattedImages = images
          .split(",")
          .map(url => url.trim())
          .filter(Boolean)
          .map(url => ({ url }));
      }
    }

    // Normalize special fields
    const defaultSpecial = { isActive: false, discountPercentage: 0, specialPrice: price };
    special = special || {};
    const finalSpecial = {
      isActive: special.isActive ?? defaultSpecial.isActive,
      discountPercentage: Number(special.discountPercentage ?? defaultSpecial.discountPercentage),
      specialPrice: Number(special.specialPrice ?? defaultSpecial.specialPrice),
    };

    // Create product
    const product = new Product({
      name,
      description,
      price,
      categories,
      stock,
      images: formattedImages,
      special: finalSpecial,
    });

    await product.save();

    // Safely compute special price
    try { computeSpecialPrice(product); } catch (err) { console.warn("computeSpecialPrice failed:", err.message); }

    res.status(201).json({ message: "Product created", product });

  } catch (err) {
    console.error("Product save error:", err);
    res.status(500).json({ message: "Create failed", error: err.message });
  }
};





/* -------------------------------------------------------
   GET ALL PRODUCTS
------------------------------------------------------- */
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, description, price, categories, stock, images, special } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (categories) product.categories = Array.isArray(categories) ? categories : [categories];
    if (stock !== undefined) product.stock = Number(stock);

    // Images
    if (images) {
      if (Array.isArray(images)) {
        product.images = images.filter(Boolean).map(url => ({ url }));
      } else if (typeof images === "string") {
        product.images = images.split(",").map(url => ({ url: url.trim() })).filter(Boolean);
      }
    }

    // Special fields
    if (special) {
      product.special.isActive = special.isActive ?? product.special.isActive;
      product.special.discountPercentage = special.discountPercentage ?? product.special.discountPercentage;
      product.special.specialPrice = special.specialPrice ?? product.special.specialPrice;
    }

    await product.save();

    // Recompute special price safely
    try { computeSpecialPrice(product); } catch (err) { console.warn("computeSpecialPrice failed:", err.message); }

    res.status(200).json({ message: "Product updated", product });
  } catch (err) {
    console.error("Product save error:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};



/* -------------------------------------------------------
   GET SINGLE PRODUCT
------------------------------------------------------- */
exports.getProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);

    if (!p) return res.status(404).json({ message: "Not found" });

    computeSpecialPrice(p);

    res.json(p);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
};


/* -------------------------------------------------------
   UPDATE PRODUCT
------------------------------------------------------- */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (req.file) {
      updates.images = updates.images || [];
      updates.images.push({ url: `/uploads/${req.file.filename}` });
    }

    // Ensure price is a number
    if (updates.price !== undefined) updates.price = Number(updates.price);

    // Ensure categories is always array
    if (updates.categories !== undefined) {
      updates.categories = Array.isArray(updates.categories)
        ? updates.categories
        : [updates.categories];
    }

    const product = await Product.findByIdAndUpdate(id, updates, { new: true });

    if (!product) return res.status(404).json({ message: "Product not found" });

    computeSpecialPrice(product);

    res.json({ message: "Updated", product });
  } catch (err) {
    console.error(err); // logs exact error
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};



/* -------------------------------------------------------
   UPLOAD IMAGE
------------------------------------------------------- */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });

    const imageUrl = `/uploads/${req.file.filename}`;
    product.images.push({ url: imageUrl });

    await product.save();
    computeSpecialPrice(product);

    res.json({ message: "Image uploaded", product });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};


/* -------------------------------------------------------
   DELETE PRODUCT
------------------------------------------------------- */
exports.deleteProduct = async (req, res) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id);

    if (!p) return res.status(404).json({ message: "Not found" });

    res.json({ message: "Deleted" });

  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};


/* -------------------------------------------------------
   SET SPECIAL
------------------------------------------------------- */
exports.setSpecial = async (req, res) => {
  try {
    const { productId } = req.params;
    const { discountPercentage, startDate, endDate } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Not found" });

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    product.special = {
      isActive: now >= start && now <= end,
      discountPercentage,
      startDate: start,
      endDate: end,
    };

    computeSpecialPrice(product);

    await product.save();

    res.json({ message: "Special set", product });
  } catch (err) {
    res.status(500).json({ message: "Special failed", error: err.message });
  }
};


/* -------------------------------------------------------
   REMOVE SPECIAL
------------------------------------------------------- */
exports.removeSpecial = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Not found" });

    product.special = {
      isActive: false,
      discountPercentage: 0,
      specialPrice: product.price,
      startDate: null,
      endDate: null,
    };

    await product.save();

    res.json({ message: "Special removed", product });
  } catch (err) {
    res.status(500).json({ message: "Special remove failed", error: err.message });
  }
};
