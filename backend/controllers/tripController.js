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
        post: true,
        driver: { select: { id: true, name: true, isKycVerified: true } },
        post: {
          include: {
            customer: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(trips);
  } catch (error) {
    console.error('Fetch Trips Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateTripStatus = async (req, res) => {
  try {
    const { id: tripId } = req.params;
    const { status, location } = req.body; // e.g., IN_TRANSIT, DELIVERED

    if (req.userRole !== 'DRIVER') {
      return res.status(403).json({ error: 'Only drivers can update trip status' });
    }

    const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { post: true } });
    if (!trip || trip.driverId !== req.userId) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    // Update Post status and Trip details
    await prisma.$transaction(async (tx) => {
      if (status === 'IN_TRANSIT' && trip.post.status === 'BOOKED') {
        await tx.loadPost.update({ where: { id: trip.postId }, data: { status: 'IN_TRANSIT' } });
      } else if (status === 'DELIVERED') {
        await tx.loadPost.update({ where: { id: trip.postId }, data: { status: 'DELIVERED' } });
        await tx.trip.update({ where: { id: tripId }, data: { completedAt: new Date() } });
      }

      if (location) {
        await tx.trip.update({ where: { id: tripId }, data: { currentLocation: location } });
        
        // Emit socket update using app level io instance if needed
        const io = req.app.get('io');
        if (io) {
            io.to(tripId).emit('statusUpdate', { status, location, timestamp: new Date() });
        }
      }
    });

    res.json({ message: 'Trip updated successfully' });
  } catch (error) {
    console.error('Update Trip Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
