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
          select: { id: true, name: true, isKycVerified: true }
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
  try {
    const { id: postId } = req.params;
    const { bidId } = req.body;

    const loadPost = await prisma.loadPost.findUnique({ where: { id: postId } });
    if (!loadPost || loadPost.customerId !== req.userId) {
      return res.status(404).json({ error: 'Load post not found' });
    }

    if (loadPost.status !== 'OPEN') {
      return res.status(400).json({ error: 'Load is no longer open' });
    }

    const bid = await prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid || bid.postId !== postId) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    // Escrow Transaction Simulation
    await prisma.$transaction(async (tx) => {
      // 1. Mark Bid as ACCEPTED and FUNDS_SECURED
      await tx.bid.update({
        where: { id: bidId },
        data: { status: 'ACCEPTED', escrowStatus: 'FUNDS_SECURED' }
      });

      // 2. Reject all other pending bids for this post
      await tx.bid.updateMany({
        where: { postId, id: { not: bidId } },
        data: { status: 'REJECTED' }
      });

      // 3. Mark LoadPost as BOOKED
      await tx.loadPost.update({
        where: { id: postId },
        data: { status: 'BOOKED' }
      });

      // 4. Create Trip
      await tx.trip.create({
        data: {
          postId,
          driverId: bid.driverId,
          currentLocation: loadPost.origin // Init location to origin
        }
      });
    });

    res.json({ message: 'Bid accepted, Escrow secured, and Trip generated securely.' });
  } catch (error) {
    console.error('Escrow Booking Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
