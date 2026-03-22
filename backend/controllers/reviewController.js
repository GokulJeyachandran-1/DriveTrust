const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createReview = async (req, res) => {
  try {
    const { tripId, revieweeId, rating, comment, speedScore, handlingScore, routeScore } = req.body;
    
    const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { post: true } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    
    if (req.userId !== trip.driverId && req.userId !== trip.post.customerId) {
        return res.status(403).json({ error: 'Not authorized to review this trip' });
    }

    const existing = await prisma.review.findUnique({
        where: { tripId_reviewerId: { tripId, reviewerId: req.userId } }
    });
    if (existing) return res.status(400).json({ error: 'You have already submitted a review for this trip' });

    const review = await prisma.review.create({
      data: {
        tripId,
        reviewerId: req.userId,
        revieweeId,
        rating: parseInt(rating),
        comment,
        speedScore: speedScore ? parseInt(speedScore) : null,
        handlingScore: handlingScore ? parseInt(handlingScore) : null,
        routeScore: routeScore ? parseInt(routeScore) : null
      }
    });

    res.json({ message: 'Review submitted successfully', review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};
