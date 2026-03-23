const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/admin/dashboard - aggregate stats
exports.getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalCustomers, totalDrivers, totalTrips, activeTrips, openSos, totalPayments, collectedPayments] = await Promise.all([
      prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'DRIVER' } }),
      prisma.trip.count(),
      prisma.trip.count({ where: { completedAt: null } }),
      prisma.sosAlert.count({ where: { status: 'OPEN' } }),
      prisma.payment.count(),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: { in: ['COLLECTED', 'RELEASED'] } } })
    ]);

    const pendingKyc = await prisma.user.count({ where: { kycStatus: 'PENDING', role: { not: 'ADMIN' } } });
    const totalRevenue = collectedPayments._sum.amount || 0;

    res.json({
      totalUsers, totalCustomers, totalDrivers,
      totalTrips, activeTrips, openSos, pendingKyc,
      totalPayments, totalRevenue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { role, kycStatus } = req.query;
    const where = { role: { not: 'ADMIN' } };
    if (role) where.role = role;
    if (kycStatus) where.kycStatus = kycStatus;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        isKycVerified: true, kycStatus: true, aadhaarNumber: true, createdAt: true,
        _count: { select: { reviewsReceived: true, trips: true, loadPosts: true, bids: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// GET /api/admin/users/:id/kyc
exports.getUserKyc = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, role: true,
        aadhaarNumber: true, kycStatus: true, isKycVerified: true,
        kycDocuments: true
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// PUT /api/admin/users/:id/kyc
exports.updateKycStatus = async (req, res) => {
  try {
    const { status } = req.body; // APPROVED or REJECTED
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
    }

    if (status === 'REJECTED') {
      // Delete KYC documents first, then delete the user entirely
      await prisma.kycDocument.deleteMany({ where: { userId: req.params.id } });
      await prisma.user.delete({ where: { id: req.params.id } });
      return res.json({ message: 'User rejected and removed. They can re-register with valid documents.' });
    }

    await prisma.user.update({
      where: { id: req.params.id },
      data: {
        kycStatus: 'APPROVED',
        isKycVerified: true
      }
    });

    res.json({ message: 'KYC approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// GET /api/admin/trips
exports.getTrips = async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      include: {
        post: { include: { customer: { select: { id: true, name: true } } } },
        driver: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// GET /api/admin/sos
exports.getSosAlerts = async (req, res) => {
  try {
    const alerts = await prisma.sosAlert.findMany({
      include: {
        trip: {
          include: {
            post: true,
            driver: { select: { id: true, name: true } }
          }
        },
        raisedBy: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// PUT /api/admin/sos/:id/resolve
exports.resolveSos = async (req, res) => {
  try {
    await prisma.sosAlert.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED', resolvedAt: new Date() }
    });
    res.json({ message: 'SOS Alert resolved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// GET /api/admin/payments
exports.getPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        bid: {
          include: {
            post: { select: { id: true, origin: true, destination: true } },
            driver: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};

// PUT /api/admin/payments/:id/release
exports.releasePayment = async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.status !== 'COLLECTED') return res.status(400).json({ error: 'Payment must be in COLLECTED status to release' });

    await prisma.payment.update({
      where: { id: req.params.id },
      data: { status: 'RELEASED', releasedAt: new Date() }
    });

    res.json({ message: `₹${payment.driverPayout.toFixed(2)} released to the driver successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
};
