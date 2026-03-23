const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Multer config
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
exports.uploadMiddleware = upload.fields([
  { name: 'aadhaarDoc', maxCount: 1 },
  { name: 'drivingLicenseDoc', maxCount: 1 }
]);

const generateTokens = (user) => {
  const access_token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_ACCESS_SECRET || 'access_secret',
    { expiresIn: '15m' }
  );
  const refresh_token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    { expiresIn: '7d' }
  );
  return { access_token, refresh_token };
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, aadhaarNumber } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!aadhaarNumber) {
      return res.status(400).json({ error: 'Aadhaar number is required' });
    }
    if (!req.files?.aadhaarDoc) {
      return res.status(400).json({ error: 'Aadhaar card document is required' });
    }
    if (role === 'DRIVER' && !req.files?.drivingLicenseDoc) {
      return res.status(400).json({ error: 'Driving License document is required for drivers' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, aadhaarNumber: aadhaarNumber || null }
    });

    // Save KYC documents if uploaded
    if (req.files) {
      if (req.files.aadhaarDoc) {
        await prisma.kycDocument.create({
          data: { userId: user.id, documentType: 'AADHAAR', filePath: `/uploads/${req.files.aadhaarDoc[0].filename}` }
        });
      }
      if (req.files.drivingLicenseDoc) {
        await prisma.kycDocument.create({
          data: { userId: user.id, documentType: 'DRIVING_LICENSE', filePath: `/uploads/${req.files.drivingLicenseDoc[0].filename}` }
        });
      }
    }

    const { access_token, refresh_token } = generateTokens(user);

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isKycVerified: user.isKycVerified },
      access_token
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    // Block non-admin users who aren't KYC approved
    if (user.role !== 'ADMIN') {
      if (user.kycStatus === 'PENDING') {
        return res.status(403).json({ error: 'Your account is pending KYC verification. Please wait for admin approval.' });
      }
      if (user.kycStatus === 'REJECTED') {
        return res.status(403).json({ error: 'Your KYC was rejected. Please contact support or re-register with valid documents.' });
      }
    }

    const { access_token, refresh_token } = generateTokens(user);

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isKycVerified: user.isKycVerified },
      access_token
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refresh_token;
    if (!token) return res.status(403).json({ error: 'Refresh token required' });

    jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret', async (err, decoded) => {
      if (err) return res.status(403).json({ error: 'Invalid or expired refresh token' });

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return res.status(403).json({ error: 'User no longer exists' });

      const { access_token, refresh_token } = generateTokens(user);

      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        access_token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, isKycVerified: user.isKycVerified }
      });
    });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('refresh_token');
  res.json({ message: 'Logged out successfully' });
};
