const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getUserTrips = async (req, res) => {
  try {
    const isCustomer = req.userRole === 'CUSTOMER';
    
    const trips = await prisma.trip.findMany({
      where: isCustomer 
        ? { post: { customerId: req.userId } }
        : { driverId: req.userId },
      include: {
        post: {
          include: {
            customer: { select: { id: true, name: true } },
            bids: {
              where: { status: 'ACCEPTED' },
              select: { id: true, amount: true, payment: { select: { status: true, amount: true, refundAmount: true } } },
              take: 1
            }
          }
        },
        driver: { select: { id: true, name: true, isKycVerified: true } },
        deduction: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(trips);
  } catch (error) {
    console.error('Fetch Trips Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Driver marks ARRIVED
exports.updateTripStatus = async (req, res) => {
  try {
    const { id: tripId } = req.params;
    const { status, location } = req.body;

    const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { post: true } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (status === 'IN_TRANSIT') {
      if (req.userRole !== 'DRIVER' || trip.driverId !== req.userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      if (trip.post.status !== 'BOOKED') {
        return res.status(400).json({ error: 'Trip must be in BOOKED status' });
      }
      await prisma.$transaction(async (tx) => {
        await tx.loadPost.update({ where: { id: trip.postId }, data: { status: 'IN_TRANSIT' } });
        if (location) await tx.trip.update({ where: { id: tripId }, data: { currentLocation: location } });
      });
    } else if (status === 'ARRIVED') {
      if (req.userRole !== 'DRIVER' || trip.driverId !== req.userId) {
        return res.status(403).json({ error: 'Only the assigned driver can mark as arrived' });
      }
      if (trip.post.status !== 'IN_TRANSIT' && trip.post.status !== 'BOOKED') {
        return res.status(400).json({ error: 'Trip must be in BOOKED or IN_TRANSIT status to mark as arrived' });
      }
      await prisma.$transaction(async (tx) => {
        await tx.loadPost.update({ where: { id: trip.postId }, data: { status: 'ARRIVED' } });
        await tx.trip.update({ where: { id: tripId }, data: { arrivedAt: new Date(), currentLocation: location || trip.post.destination } });
      });
    } else {
      return res.status(400).json({ error: 'Invalid status. Use IN_TRANSIT or ARRIVED.' });
    }

    // Emit socket update
    const io = req.app.get('io');
    if (io) io.to(tripId).emit('statusUpdate', { status, location, timestamp: new Date() });

    res.json({ message: `Trip status updated to ${status}` });
  } catch (error) {
    console.error('Update Trip Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Customer confirms delivery
exports.confirmDelivery = async (req, res) => {
  try {
    const { id: tripId } = req.params;

    if (req.userRole !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Only the customer can confirm delivery' });
    }

    const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { post: true } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.post.customerId !== req.userId) return res.status(403).json({ error: 'Unauthorized' });
    if (trip.post.status !== 'ARRIVED') {
      return res.status(400).json({ error: 'Driver has not marked as arrived yet' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.loadPost.update({ where: { id: trip.postId }, data: { status: 'DELIVERED' } });
      await tx.trip.update({ where: { id: tripId }, data: { completedAt: new Date() } });
    });

    const io = req.app.get('io');
    if (io) io.to(tripId).emit('statusUpdate', { status: 'DELIVERED', timestamp: new Date() });

    res.json({ message: 'Delivery confirmed! You can now rate and review.' });
  } catch (error) {
    console.error('Confirm Delivery Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Customer submits damage deduction
exports.submitDamageDeduction = async (req, res) => {
  try {
    const { id: tripId } = req.params;
    const { amount, reason } = req.body;

    if (req.userRole !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Only the customer can report damages' });
    }
    if (!amount || amount <= 0 || !reason?.trim()) {
      return res.status(400).json({ error: 'Valid amount and reason are required' });
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { post: { include: { bids: { where: { status: 'ACCEPTED' }, take: 1 } } } }
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.post.customerId !== req.userId) return res.status(403).json({ error: 'Unauthorized' });
    if (trip.post.status !== 'ARRIVED') {
      return res.status(400).json({ error: 'Damages can only be reported after driver has arrived' });
    }

    const bidAmount = trip.post.bids[0]?.amount || 0;
    if (amount > bidAmount) {
      return res.status(400).json({ error: `Deduction cannot exceed the bid amount of ₹${bidAmount}` });
    }

    // Check for existing deduction
    const existing = await prisma.damageDeduction.findUnique({ where: { tripId } });
    if (existing) {
      return res.status(400).json({ error: 'A damage report already exists for this trip' });
    }

    const deduction = await prisma.damageDeduction.create({
      data: { tripId, amount: parseFloat(amount), reason: reason.trim() }
    });

    res.status(201).json({ message: 'Damage report submitted. Admin will review.', deduction });
  } catch (error) {
    console.error('Damage Deduction Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
