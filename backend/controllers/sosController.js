const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.raiseSos = async (req, res) => {
  try {
    const { tripId } = req.body;
    const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { post: true } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (req.userId !== trip.driverId && req.userId !== trip.post.customerId) {
        return res.status(403).json({ error: 'Not authorized to raise SOS on this trip' });
    }

    const alert = await prisma.sosAlert.create({
      data: {
        tripId,
        raisedById: req.userId,
        status: 'OPEN'
      }
    });

    const io = req.app.get('io');
    if (io) {
       io.emit('admin_sos_alert', { alert, tripId });
    }

    res.json({ message: 'SOS Alert raised successfully! Admin team has been notified and is tracking your location.', alert });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};
