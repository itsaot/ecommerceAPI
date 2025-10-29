const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
}

// 🔐 Verify user authentication
exports.auth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach decoded user info to request
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token." });
  }
};

// 🧩 Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};
exports.register = async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  if (!email || !password || !firstName || !lastName) return res.status(400).json({ message: 'Missing fields' });
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already used' });
  const user = await User.create({ firstName, lastName, email, phone, password });
  // send welcome email (async)
  try {
    sendEmail({ to: user.email, subject: 'Welcome', html: `<p>Welcome ${user.firstName}</p>` });
  } catch (e) { console.warn('Email failed', e.message); }
  const token = signToken(user);
  res.json({ token, user: { id: user._id, email: user.email, firstName: user.firstName, role: user.role } });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = signToken(user);
  res.json({ token, user: { id: user._id, email: user.email, firstName: user.firstName, role: user.role } });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(200).json({ message: 'If that email exists, a reset link was sent.' });
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetPasswordToken = hashed;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
  await user.save();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
  await sendEmail({ to: email, subject: 'Reset your password', html: `<p>Click <a href="${resetUrl}">here</a> to reset</p>` });
  res.json({ message: 'If that email exists, a reset link was sent.' });
};

exports.resetPassword = async (req, res) => {
  const { token, email, newPassword } = req.body;
  if (!token || !email || !newPassword) return res.status(400).json({ message: 'Invalid request' });
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({ email, resetPasswordToken: hashed, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ message: 'Password reset successful' });
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
};

exports.updateMe = async (req, res) => {
  const allowed = ['firstName','lastName','phone'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
  res.json(user);
};

exports.addAddress = async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ message: 'Address required' });
  const user = await User.findById(req.user._id);
  if (address.isDefault) user.addresses.forEach(a => a.isDefault = false);
  user.addresses.push(address);
  await user.save();
  res.json(user.addresses);
};
