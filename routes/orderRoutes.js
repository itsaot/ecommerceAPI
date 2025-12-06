const express = require('express');
const router = express.Router();
const orders = require('../controllers/ordersController');
const { auth, isAdmin } = require('../middleware/auth');

// ADMIN
router.get('/admin/all', auth, isAdmin, orders.getAllOrders);
router.put('/admin/:id/status', auth, isAdmin, orders.adminUpdateStatus);

// USER
router.post('/', auth, orders.createOrder);
router.get('/', auth, orders.getUserOrders);
router.get('/:id', auth, orders.getOrder); // single order, must be last

module.exports = router;
