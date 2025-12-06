const axios = require('axios');
const Order = require('../models/Order');
const Product = require('../models/Product');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.wisetenengeneering.co.za';

/* -------------------------------------------------------
   CREATE PAYMENT SESSION (Paystack)
   POST /api/payments/create-session
------------------------------------------------------- */
exports.createSession = async (req, res) => {
  try {
    const { items, customerEmail, shippingAddress, total } = req.body;
    const userId = req.user?.id || req.user?._id;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items provided' });
    }

    if (!customerEmail) {
      return res.status(400).json({ message: 'Customer email is required' });
    }

    // Validate products exist and calculate total
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.productId} not found` });
      }

      // Use special price if active, otherwise regular price
      let itemPrice = product.price;
      if (product.special?.isActive && product.special?.specialPrice) {
        itemPrice = product.special.specialPrice;
      }

      validatedItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity || 1,
        price: itemPrice,
      });

      calculatedTotal += itemPrice * (item.quantity || 1);
    }

    // Use calculated total or provided total (with validation)
    const orderTotal = total || calculatedTotal;

    // Generate unique reference
    const reference = `WTE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create order with pending payment status
    const order = new Order({
      userId,
      items: validatedItems,
      total: orderTotal,
      status: 'pending',
      paymentStatus: 'pending',
      paymentReference: reference,
      shippingAddress,
    });

    await order.save();

    // Initialize Paystack transaction
    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: customerEmail,
        amount: Math.round(orderTotal * 100), // Paystack expects amount in kobo/cents
        reference,
        callback_url: `${FRONTEND_URL}/payment/success?reference=${reference}`,
        metadata: {
          orderId: order._id.toString(),
          userId: userId?.toString(),
          items: validatedItems.map(i => ({ name: i.name, qty: i.quantity })),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!paystackResponse.data.status) {
      // Rollback order if Paystack fails
      await Order.findByIdAndDelete(order._id);
      return res.status(400).json({ message: 'Failed to initialize payment' });
    }

    res.json({
      authorization_url: paystackResponse.data.data.authorization_url,
      reference: paystackResponse.data.data.reference,
      orderId: order._id,
    });

  } catch (error) {
    console.error('Create session error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Failed to create payment session', 
      error: error.response?.data?.message || error.message 
    });
  }
};


/* -------------------------------------------------------
   VERIFY PAYMENT (Paystack)
   GET /api/payments/verify/:reference
------------------------------------------------------- */
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ message: 'Payment reference is required' });
    }

    // Find order by payment reference
    const order = await Order.findOne({ paymentReference: reference });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found for this reference' });
    }

    // If already verified, return success
    if (order.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        orderId: order._id,
        order,
      });
    }

    // Verify with Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { status, data } = paystackResponse.data;

    if (status && data.status === 'success') {
      // Update order status
      order.paymentStatus = 'paid';
      order.status = 'processing';
      order.paidAt = new Date();
      await order.save();

      // Optionally: Update product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity }
        });
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        orderId: order._id,
        order,
      });
    } else {
      // Payment failed
      order.paymentStatus = 'failed';
      await order.save();

      res.json({
        success: false,
        message: 'Payment verification failed',
        orderId: order._id,
      });
    }

  } catch (error) {
    console.error('Verify payment error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Failed to verify payment', 
      error: error.response?.data?.message || error.message 
    });
  }
};


/* -------------------------------------------------------
   PAYSTACK WEBHOOK (Optional - for automatic updates)
   POST /api/payments/webhook
------------------------------------------------------- */
exports.webhook = async (req, res) => {
  try {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const { event, data } = req.body;

    if (event === 'charge.success') {
      const { reference } = data;
      
      const order = await Order.findOne({ paymentReference: reference });
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.status = 'processing';
        order.paidAt = new Date();
        await order.save();

        // Update product stock
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity }
          });
        }
      }
    }

    res.sendStatus(200);

  } catch (error) {
    console.error('Webhook error:', error.message);
    res.sendStatus(500);
  }
};