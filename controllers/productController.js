const Product = require('../models/Product');

/* -------------------------------------------------------
   CREATE PRODUCT
------------------------------------------------------- */
exports.createProduct = async (req, res) => {
  try {
    let { 
      name, 
      description, 
      price, 
      categories, 
      stock, 
      images, 
      special 
    } = req.body;

    // ------------------------------------------------------------------
    // VALIDATION
    // ------------------------------------------------------------------
    if (!name || !description || price === undefined) {
      return res
        .status(400)
        .json({ message: "Name, description, and price are required" });
    }

    // ------------------------------------------------------------------
    // NORMALIZE NUMBERS
    // ------------------------------------------------------------------
    price = Number(price);
    if (isNaN(price)) {
      return res.status(400).json({ message: "Price must be a valid number" });
    }

    stock = stock ? Number(stock) : 0;

    // ------------------------------------------------------------------
    // NORMALIZE CATEGORIES
    // ------------------------------------------------------------------
    if (!categories) categories = [];
    if (!Array.isArray(categories)) {
      categories = [categories];
    }

    // ------------------------------------------------------------------
    // NORMALIZE IMAGES
    // ------------------------------------------------------------------
    let formattedImages = [];
    if (images) {
      if (Array.isArray(images)) {
        formattedImages = images
          .filter(Boolean)
          .map((url) => ({ url }));
      } else if (typeof images === "string") {
        formattedImages = images
          .split(",")
          .map((url) => url.trim())
          .filter(Boolean)
          .map((url) => ({ url }));
      }
    }

    // ------------------------------------------------------------------
    // NORMALIZE SPECIAL FIELDS
    // ------------------------------------------------------------------
    const defaultSpecial = {
      isActive: false,
      discountPercentage: 0,
      specialPrice: price,
    };

    special = special || {};

    const finalSpecial = {
      isActive: Boolean(special.isActive ?? defaultSpecial.isActive),
      discountPercentage: Number(
        special.discountPercentage ?? defaultSpecial.discountPercentage
      ),
      specialPrice: Number(
        special.specialPrice ?? defaultSpecial.specialPrice
      ),
    };

    // ------------------------------------------------------------------
    // BUILD PRODUCT
    // ------------------------------------------------------------------
    const product = new Product({
      name,
      description,
      price,
      categories,
      stock,
      images: formattedImages,
      special: finalSpecial,
    });

    // ------------------------------------------------------------------
    // COMPUTE SPECIAL PRICE BEFORE SAVING
    // ------------------------------------------------------------------
    computeSpecialPrice(product);

    await product.save();

    return res.status(201).json({
      message: "Product created",
      product,
    });

  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err);
    return res.status(500).json({
      message: "Create failed",
      error: err.message,
    });
  }
};

/* -------------------------------------------------------
   GET ALL PRODUCTS
------------------------------------------------------- */
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, q, category } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    if (category) {
      filter.categories = category;
    }

    const products = await Product.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    products.forEach((p) => computeSpecialPrice(p));

    res.json({
      page: Number(page),
      limit: Number(limit),
      total: products.length,
      products,
    });
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
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
   UTILITY: Compute special price safely
------------------------------------------------------- */
function computeSpecialPrice(product) {
  if (!product.special) return;

  const { discountPercentage = 0, isActive = false } = product.special;

  // Compute discounted price only if active and discount > 0
  if (isActive && discountPercentage > 0) {
    product.special.specialPrice = Math.round(
      (product.price * (100 - discountPercentage)) / 100
    );
  } else {
    // Fallback to original price without overwriting other fields
    product.special.specialPrice = product.price;
  }
}

/* -------------------------------------------------------
   SET SPECIAL
------------------------------------------------------- */
exports.setSpecial = async (req, res) => {
  try {
    const { productId } = req.params;
    const { discountPercentage, startDate, endDate } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Set special fields
    product.special = {
      ...product.special,        // preserve existing fields if any
      isActive: now >= start && now <= end,
      discountPercentage: Number(discountPercentage) || 0,
      startDate: start,
      endDate: end,
    };

    // Compute specialPrice safely
    computeSpecialPrice(product);

    await product.save();

    res.json({ message: "Special set successfully", product });
  } catch (err) {
    console.error("Set special failed:", err);
    res.status(500).json({ message: "Special set failed", error: err.message });
  }
};

/* -------------------------------------------------------
   REMOVE SPECIAL
------------------------------------------------------- */
exports.removeSpecial = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Reset special fields
    product.special = {
      ...product.special,
      isActive: false,
      discountPercentage: 0,
      specialPrice: product.price,
      startDate: null,
      endDate: null,
    };

    await product.save();

    res.json({ message: "Special removed successfully", product });
  } catch (err) {
    console.error("Remove special failed:", err);
    res.status(500).json({ message: "Special remove failed", error: err.message });
  }
};
