import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    console.log('Admin user created:', admin.email);

    // Create staff user
    const staffPassword = await bcrypt.hash('Staff123!', 10);
    
    const staff = await prisma.user.create({
      data: {
        email: 'staff@example.com',
        password: staffPassword,
        firstName: 'Staff',
        lastName: 'User',
        role: 'STAFF',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    console.log('Staff user created:', staff.email);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
