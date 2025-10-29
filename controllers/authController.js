// controllers/authController.js (forgot-password)
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if(!user) return res.status(200).json({ message: 'If that email exists, a reset link was sent.' }); // avoid revealing
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetPasswordToken = hashed;
  user.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hour
  await user.save();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`
  });
  res.json({ message: 'If that email exists, a reset link was sent.' });
};

// controllers/authController.js (reset-password)
exports.resetPassword = async (req, res) => {
  const { token, email, newPassword } = req.body;
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    email,
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if(!user) return res.status(400).json({ message: 'Invalid or expired token' });
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ message: 'Password reset successful' });
};
// controllers/authController.js