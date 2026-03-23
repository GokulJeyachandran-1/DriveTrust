const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// GET /api/users/:id/profile (public profile - anonymous reviews)
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

// GET /api/users/me — Get own full profile
exports.getMyProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, name: true, email: true, role: true,
        createdAt: true, isKycVerified: true, kycStatus: true,
        aadhaarNumber: true,
        reviewsReceived: {
          select: { rating: true, comment: true, speedScore: true, handlingScore: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { loadPosts: true, bids: true, trips: true, reviewsGiven: true } }
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get My Profile Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /api/users/me — Update own profile
exports.updateMyProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const updateData = {};

    if (name && name.trim().length >= 2) {
      updateData.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password is required to change password' });
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true }
    });

    res.json({ message: 'Profile updated successfully', user: updated });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
