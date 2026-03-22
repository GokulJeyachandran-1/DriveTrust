const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getOpenLoads = async (req, res) => {
  try {
    const loads = await prisma.loadPost.findMany({
      where: { status: 'OPEN' },
      include: {
        customer: {
          select: { name: true, isKycVerified: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(loads);
  } catch (error) {
    console.error('Fetch Open Loads Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.submitBid = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { amount, message } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Bid amount is required' });
    }

    const loadPost = await prisma.loadPost.findUnique({ where: { id: postId } });
    if (!loadPost) return res.status(404).json({ error: 'Load post not found' });
    if (loadPost.status !== 'OPEN') return res.status(400).json({ error: 'Load is not open for bidding' });

    // Check if driver already bid
    const existingBid = await prisma.bid.findFirst({
      where: { postId, driverId: req.userId }
    });

    if (existingBid) {
      return res.status(400).json({ error: 'You have already placed a bid on this load' });
    }

    const bid = await prisma.bid.create({
      data: {
        postId,
        driverId: req.userId,
        amount: parseFloat(amount),
        message: message || null
      }
    });

    res.status(201).json({ message: 'Bid submitted successfully', bid });
  } catch (error) {
    console.error('Submit Bid Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
