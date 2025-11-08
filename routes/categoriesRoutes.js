const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoryController');
const { auth, isAdmin } = require('../middleware/auth');

// Public
router.get('/', ctrl.getAllCategories);
router.get('/:id', ctrl.getCategoryById);

// Admin
router.post('/', auth, isAdmin, ctrl.createCategory);
router.put('/:id', auth, isAdmin, ctrl.updateCategory);
router.delete('/:id', auth, isAdmin, ctrl.deleteCategory);

module.exports = router;
