const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getMyLoads = async (req, res) => {
  try {
    const loads = await prisma.loadPost.findMany({
      where: { customerId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(loads);
  } catch (error) {
    console.error('Fetch My Loads Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.createLoad = async (req, res) => {
  try {
    const { origin, destination, requiredVehicle, estimatedWeightKg } = req.body;
    
    if (!origin || !destination || !requiredVehicle || !estimatedWeightKg) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const loadPost = await prisma.loadPost.create({
      data: {
        customerId: req.userId,
        origin,
        destination,
        requiredVehicle,
        estimatedWeightKg: parseFloat(estimatedWeightKg)
      }
    });

    res.status(201).json(loadPost);
  } catch (error) {
    console.error('Create Load Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getBidsForLoad = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify load belongs to customer
    const loadPost = await prisma.loadPost.findUnique({ where: { id } });
    if (!loadPost || loadPost.customerId !== req.userId) {
      return res.status(404).json({ error: 'Load post not found' });
    }

    const bids = await prisma.bid.findMany({
      where: { postId: id },
      include: {
        driver: {
          select: { id: true, name: true, isKycVerified: true, reviewsReceived: { select: { rating: true } } }
        }
      },
      orderBy: { amount: 'asc' }
    });

    res.json(bids);
  } catch (error) {
    console.error('Fetch Bids Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.acceptBidAndBook = async (req, res) => {
  // This endpoint is now handled by the Razorpay payment flow:
  // 1. POST /api/payments/create-order (creates Razorpay order)
  // 2. Frontend opens Razorpay checkout
  // 3. POST /api/payments/verify (verifies + books atomically)
  return res.status(400).json({
    error: 'Direct booking is disabled. Please use the Pay & Book flow.'
  });
};
