const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth } = require('../middleware/auth'); // <-- updated import

// Create payment session (requires auth)
router.post('/create-session', auth, paymentController.createSession);

// Verify payment (public - called after redirect)
router.get('/verify/:reference', paymentController.verifyPayment);

// Webhook (public - called by Paystack)
router.post('/webhook', paymentController.webhook);

module.exports = router;
