import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    
    const admin = await prisma.users.create({
      data: {
        email: 'admin@example.com',
        password: adminPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'ADMIN',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    
    console.log('Admin user created:', admin.email);

    // Create staff user
    const staffPassword = await bcrypt.hash('Staff123!', 10);
    
    const staff = await prisma.users.create({
      data: {
        email: 'staff@example.com',
        password: staffPassword,
        first_name: 'Staff',
        last_name: 'User',
        role: 'STAFF',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
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
