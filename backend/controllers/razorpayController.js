/**
 * Razorpay Payment Controller
 * 
 * Security measures:
 * 1. HMAC-SHA256 signature verification on every payment callback
 * 2. Idempotent payment processing (checks if already collected)
 * 3. Amount validation between order and database
 * 4. Server-side order creation (amount is NEVER trusted from client)
 * 5. Atomic transactions for all state changes
 * 6. Payment timeout handling via Razorpay config
 */
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Initialize Razorpay with server-side keys only
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for a specific bid.
 * Amount is derived from the database, NEVER from the client.
 */
exports.createOrder = async (req, res) => {
  try {
    const { bidId } = req.body;
    if (!bidId) return res.status(400).json({ error: 'Bid ID is required' });

    // Verify the bid exists and belongs to a load owned by this customer
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { post: true }
    });

    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.post.customerId !== req.userId) {
      return res.status(403).json({ error: 'You are not authorized to pay for this bid' });
    }
    if (bid.post.status !== 'OPEN') {
      return res.status(400).json({ error: 'This load is no longer open for booking' });
    }
    if (bid.status !== 'PENDING') {
      return res.status(400).json({ error: 'This bid has already been processed' });
    }

    // Check for existing pending payment (idempotency)
    const existingPayment = await prisma.payment.findUnique({ where: { bidId } });
    if (existingPayment) {
      if (existingPayment.status === 'COLLECTED') {
        return res.status(400).json({ error: 'Payment already completed for this bid' });
      }
      // If a pending order already exists and hasn't expired, return it
      if (existingPayment.razorpayOrderId) {
        try {
          const existingOrder = await razorpay.orders.fetch(existingPayment.razorpayOrderId);
          if (existingOrder.status === 'created') {
            return res.json({
              orderId: existingOrder.id,
              amount: existingOrder.amount,
              currency: existingOrder.currency,
              paymentId: existingPayment.id,
            });
          }
        } catch (e) {
          // Order expired or invalid, create new one below
        }
      }
    }

    // Amount in paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(bid.amount * 100);

    // Create Razorpay order — amount is SERVER-DERIVED
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `bid_${bidId.substring(0, 16)}`,
      notes: {
        bidId: bidId,
        customerId: req.userId,
        driverId: bid.driverId,
        loadPostId: bid.postId,
      },
      payment_capture: 1, // Auto-capture on successful payment
    });

    // Calculate fees
    const platformFee = bid.amount * 0.10;
    const driverPayout = bid.amount - platformFee;

    // Upsert payment record
    if (existingPayment) {
      await prisma.payment.update({
        where: { bidId },
        data: { razorpayOrderId: order.id, status: 'PENDING' }
      });
    } else {
      await prisma.payment.create({
        data: {
          bidId,
          amount: bid.amount,
          platformFee,
          driverPayout,
          status: 'PENDING',
          razorpayOrderId: order.id,
        }
      });
    }

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature using HMAC-SHA256.
 * On success: marks payment as COLLECTED, books the load, creates trip.
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bidId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bidId) {
      return res.status(400).json({ error: 'Missing payment verification parameters' });
    }

    // ===== SECURITY: HMAC-SHA256 Signature Verification =====
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('PAYMENT SIGNATURE MISMATCH — Possible tampering detected!');
      // Mark payment as failed
      await prisma.payment.updateMany({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: 'FAILED' }
      });
      return res.status(400).json({ error: 'Payment verification failed. Signature mismatch.' });
    }

    // ===== SECURITY: Idempotency Check =====
    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
    if (!payment) return res.status(404).json({ error: 'Payment record not found' });
    if (payment.status === 'COLLECTED') {
      return res.json({ message: 'Payment already verified and collected', alreadyProcessed: true });
    }
    if (payment.bidId !== bidId) {
      return res.status(400).json({ error: 'Bid ID mismatch with payment record' });
    }

    // ===== SECURITY: Amount Verification from Razorpay Server =====
    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
    const expectedAmountPaise = Math.round(payment.amount * 100);
    if (razorpayPayment.amount !== expectedAmountPaise) {
      console.error(`AMOUNT MISMATCH: Expected ₹${payment.amount}, got ₹${razorpayPayment.amount / 100}`);
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      });
      return res.status(400).json({ error: 'Payment amount mismatch. Possible tampering.' });
    }

    if (razorpayPayment.status !== 'captured') {
      return res.status(400).json({ error: `Payment not captured. Status: ${razorpayPayment.status}` });
    }

    // ===== ATOMIC TRANSACTION: Book load + create trip =====
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { post: true }
    });

    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    await prisma.$transaction(async (tx) => {
      // 1. Update payment as COLLECTED
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COLLECTED',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          collectedAt: new Date(),
        }
      });

      // 2. Accept bid, secure escrow
      await tx.bid.update({
        where: { id: bidId },
        data: { status: 'ACCEPTED', escrowStatus: 'FUNDS_SECURED' }
      });

      // 3. Reject all other bids
      await tx.bid.updateMany({
        where: { postId: bid.postId, id: { not: bidId } },
        data: { status: 'REJECTED' }
      });

      // 4. Mark load as BOOKED
      await tx.loadPost.update({
        where: { id: bid.postId },
        data: { status: 'BOOKED' }
      });

      // 5. Create trip
      await tx.trip.create({
        data: {
          postId: bid.postId,
          driverId: bid.driverId,
          currentLocation: bid.post.origin,
        }
      });
    });

    res.json({
      message: 'Payment verified and booking confirmed!',
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ error: 'Payment verification failed. Please contact support.' });
  }
};

/**
 * GET /api/payments/status/:orderId
 * Check payment status for a given Razorpay order.
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: orderId }
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    // Fetch live status from Razorpay
    const order = await razorpay.orders.fetch(orderId);

    res.json({
      dbStatus: payment.status,
      razorpayStatus: order.status,
      amount: payment.amount,
      collectedAt: payment.collectedAt,
    });
  } catch (error) {
    console.error('Payment Status Error:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
};
