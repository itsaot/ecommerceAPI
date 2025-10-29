// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true, index: true },
  phone:     { type: String },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  isMetaAdmin: { type: Boolean, default: false }, // 🔥 only one or few can have this
  addresses: [{
    label: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    isDefault: { type: Boolean, default: false }
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now }
});

// 🔐 Hash password before save
userSchema.pre('save', async function(next){
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function(candidate){
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
