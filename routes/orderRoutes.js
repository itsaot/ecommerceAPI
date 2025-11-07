const express = require('express');
const router = express.Router();
const checkout = require('../controllers/checkoutController');
const orders = require('../controllers/orderController');
const { auth, isAdmin } = require('../middleware/auth');

// user checkout via Paystack
router.post('/paystack', auth, checkout.createPaystackPayment);

// get user orders
router.get('/', auth, orders.getUserOrders);
router.get('/:id', auth, orders.getOrder);

// admin order management
router.get('/admin/all', auth, isAdmin, orders.adminGetOrders);
router.put('/admin/:id/status', auth, isAdmin, orders.adminUpdateStatus);

module.exports = router;
