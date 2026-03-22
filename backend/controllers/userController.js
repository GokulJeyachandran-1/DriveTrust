const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        isKycVerified: true,
        reviewsReceived: {
          select: {
            rating: true,
            comment: true,
            speedScore: true,
            handlingScore: true,
            routeScore: true,
            createdAt: true
            // DELIBERATELY EXCLUDING REVIEWER NAME FOR ANONYMITY!
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Fetch User Profile Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
