const express = require('express');
const router = express.Router();
const orders = require('../controllers/orderController');
const { auth, isAdmin } = require('../middleware/auth');

/* ----------------------------------------
   ADMIN ROUTES (must be above /:id)
----------------------------------------- */
router.get('/admin/all', auth, isAdmin, orders.adminGetOrders);
router.put('/admin/:id/status', auth, isAdmin, orders.adminUpdateStatus);

/* ----------------------------------------
   USER ORDER ROUTES
----------------------------------------- */
router.post('/', auth, orders.createOrder);       // Create order
router.get('/', auth, orders.getUserOrders);     // Get all user orders
router.get('/:id', auth, orders.getOrder);       // Get single user order

module.exports = router;
