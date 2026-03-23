const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seed() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@drivetrust.com' } });
  if (existing) {
    console.log('Admin user already exists.');
    return;
  }

  const passwordHash = await bcrypt.hash('admin@123', 10);
  await prisma.user.create({
    data: {
      name: 'DriveTrust Admin',
      email: 'admin@drivetrust.com',
      passwordHash,
      role: 'ADMIN',
      aadhaarNumber: 'ADMIN000000000',
      isKycVerified: true,
      kycStatus: 'APPROVED'
    }
  });
  console.log('Admin user seeded: admin@drivetrust.com / admin123');
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
