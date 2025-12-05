const express = require('express');
const router = express.Router();
const checkout = require('../controllers/checkoutController');
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
router.post('/', auth, orders.createOrder);

// Paystack payment init
router.post('/paystack', auth, checkout.createPaystackPayment);

// Get user orders
router.get('/', auth, orders.getUserOrders);

// Single user order (MUST be last)
router.get('/:id', auth, orders.getOrder);

module.exports = router;
