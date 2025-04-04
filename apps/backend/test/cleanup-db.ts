import { PrismaClient } from '@prisma/client';

async function cleanDb() {
  const prisma = new PrismaClient();
  try {
    console.log('Deleting all users...');
    await prisma.user.deleteMany({});
    console.log('Database cleaned successfully');
  } catch (error) {
    console.error('Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDb();
