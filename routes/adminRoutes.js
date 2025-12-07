const express = require('express');
const router = express.Router();
const User = require('../models/User');
const adminController = require("../controllers/adminController");
const { auth, isAdmin } = require('../middleware/auth');

// 🏠 Admin Dashboard
router.get("/dashboard", auth, isAdmin, adminController.getDashboard);

// 🔍 Search users
router.get('/users/search', auth, isAdmin, adminController.searchUsers);

// ➕ Create admin/user
router.post('/users', auth, isAdmin, async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  if (!firstName || !lastName || !email || !password)
    return res.status(400).json({ message: 'Missing fields' });

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || 'admin'
  });

  res.json({ id: user._id, email: user.email, role: user.role });
});

// 📋 List all users
router.get('/users', auth, isAdmin, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// ❌ Delete user
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'deleted' });
});

// 🔼 Promote user → admin
router.put("/users/:id/promote", auth, isAdmin, adminController.promoteUser);

// 🔽 Demote user → normal user
router.put("/users/:id/demote", auth, isAdmin, adminController.demoteUser);

module.exports = router;
