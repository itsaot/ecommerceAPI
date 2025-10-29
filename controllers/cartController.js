const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  res.json(cart || { items: [] });
};

exports.addItem = async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  const existing = cart.items.find(i => i.product.toString() === productId);
  if (existing) existing.quantity += quantity;
  else cart.items.push({ product: productId, quantity });
  cart.updatedAt = Date.now();
  await cart.save();
  res.json(cart);
};

exports.updateCart = async (req, res) => {
  const { items } = req.body; // [{ product: id, quantity }]
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  cart.items = items;
  cart.updatedAt = Date.now();
  await cart.save();
  res.json(cart);
};

exports.removeItem = async (req, res) => {
  const productId = req.params.productId;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });
  cart.items = cart.items.filter(i => i.product.toString() !== productId);
  cart.updatedAt = Date.now();
  await cart.save();
  res.json(cart);
};
