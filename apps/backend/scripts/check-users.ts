import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Count users
    const userCount = await prisma.users.count();
    console.log(`Total users in database: ${userCount}`);

    // Get all users (first 10)
    const users = await prisma.users.findMany({
      take: 10,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true,
        created_at: true,
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
