const Product = require('../models/Product');
const multer = require('multer');

// simple create/list/update/delete
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const product = new Product({
      name,
      description,
      price,
      category,
      image,
    });

    await product.save();
    res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    res.status(500).json({ message: "Failed to create product", error: err.message });
  }
};

exports.getProducts = async (req, res) => {
  const { page = 1, limit = 20, q, category } = req.query;
  const filter = {};
  if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];
  if (category) filter.categories = category;
  const products = await Product.find(filter)
    .skip((page-1)*limit)
    .limit(+limit)
    .sort({ createdAt: -1 });
  res.json(products);
};

exports.getProduct = async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Not found' });
  res.json(p);
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (req.file) updates.image = `/uploads/${req.file.filename}`;

    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product updated", product });
  } catch (err) {
    res.status(500).json({ message: "Failed to update product", error: err.message });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Multer stores file locally in /uploads/
    const imageUrl = `/uploads/${req.file.filename}`;
    product.images.push({ url: imageUrl });
    await product.save();

    res.status(200).json({
      message: "Image uploaded successfully",
      product,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
};

exports.deleteProduct = async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
};

// Set a special for a product
exports.setSpecial = async (req, res) => {
  try {
    const { productId } = req.params;
    const { discountPercentage, startDate, endDate } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    product.special = {
      isActive: now >= start && now <= end, // auto-active if within date range
      discountPercentage,
      startDate: start,
      endDate: end,
    };

        product.checkAndUpdateSpecial();

    await product.save();
    res.json({ message: "Special added successfully", product });
  } catch (err) {
    console.error("Error setting special:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// Remove a special
exports.removeSpecial = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.special = {
      isActive: false,
      discountPercentage: 0,
      startDate: null,
      endDate: null,
    };

    await product.save();
    res.json({ message: "Special removed successfully", product });
  } catch (err) {
    console.error("Error removing special:", err);
    res.status(500).json({ error: "Server error" });
  }
};
