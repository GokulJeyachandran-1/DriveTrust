const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { createOrder, verifyPayment, getPaymentStatus } = require('../controllers/razorpayController');

// All payment routes require authentication
router.post('/create-order', verifyToken, createOrder);
router.post('/verify', verifyToken, verifyPayment);
router.get('/status/:orderId', verifyToken, getPaymentStatus);

module.exports = router;
