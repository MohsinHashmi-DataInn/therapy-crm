import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Count users
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);

    // Get all users (first 10)
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        // Exclude password for security
      }
    });

    console.log('Users in database:');
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
