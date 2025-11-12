const express = require('express');
const router = express.Router();
const User = require('../models/User');
const adminController = require("../controllers/adminController");
const { auth, isAdmin } = require('../middleware/auth');

router.get("/dashboard", auth, isAdmin, adminController.getDashboard);
router.post('/users', auth, isAdmin, async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  if (!firstName || !lastName || !email || !password) return res.status(400).json({ message: 'Missing' });
  const user = await User.create({ firstName, lastName, email, password, role: role || 'admin' });
  res.json({ id: user._id, email: user.email, role: user.role });
});

router.get('/users', auth, isAdmin, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'deleted' });
});

router.get('/users/search', auth, isAdmin, adminController.searchUsers);

module.exports = router;
