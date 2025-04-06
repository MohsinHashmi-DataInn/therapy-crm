/**
 * Test database seeding script
 * This script seeds the test database with test users for e2e tests
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { TEST_USERS } from './setup';
import { UserRole } from '../src/modules/auth/guards/roles.guard';

export const seedTestDatabase = async () => {
  const prisma = new PrismaClient();
  const SALT_ROUNDS = 10;

  try {
    console.log('Seeding test database...');

    // Clean up existing test users to ensure a fresh start
    console.log('Cleaning up existing test users...');
    await prisma.users.deleteMany({
      where: {
        email: {
          in: [TEST_USERS.admin.email, TEST_USERS.staff.email]
        }
      }
    });
    console.log('Existing test users deleted');

    // Hash passwords for test users using the same approach as the user service
    console.log('Hashing test passwords with salt rounds:', SALT_ROUNDS);
    console.log('Admin password (before hashing):', TEST_USERS.admin.password);
    console.log('Staff password (before hashing):', TEST_USERS.staff.password);

    const adminPasswordHash = await bcrypt.hash(TEST_USERS.admin.password, SALT_ROUNDS);
    const staffPasswordHash = await bcrypt.hash(TEST_USERS.staff.password, SALT_ROUNDS);

    console.log('Admin password hash:', adminPasswordHash);
    console.log('Staff password hash:', staffPasswordHash);

    // Use upsert to avoid unique constraint errors
    const adminUser = await prisma.users.upsert({
      where: {
        email: TEST_USERS.admin.email
      },
      update: {
        first_name: 'Admin',
        last_name: 'User',
        password: adminPasswordHash,
        role: TEST_USERS.admin.role as UserRole,
        is_active: true,
        updated_at: new Date(),
      },
      create: {
        email: TEST_USERS.admin.email,
        first_name: 'Admin',
        last_name: 'User',
        password: adminPasswordHash,
        role: TEST_USERS.admin.role as UserRole,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log('Created admin user with ID:', adminUser.id.toString());
    console.log('Admin password hash in database:', adminUser.password);

    // Use upsert to avoid unique constraint errors
    const staffUser = await prisma.users.upsert({
      where: {
        email: TEST_USERS.staff.email
      },
      update: {
        first_name: 'Staff',
        last_name: 'User',
        password: staffPasswordHash,
        role: TEST_USERS.staff.role as UserRole,
        is_active: true,
        updated_at: new Date(),
      },
      create: {
        email: TEST_USERS.staff.email,
        first_name: 'Staff',
        last_name: 'User',
        password: staffPasswordHash,
        role: TEST_USERS.staff.role as UserRole,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log('Created staff user with ID:', staffUser.id.toString());
    console.log('Staff password hash in database:', staffUser.password);

    console.log('Test database seeded successfully');
    console.log(`Created/updated admin user with ID: ${adminUser.id}`);
    console.log(`Created/updated staff user with ID: ${staffUser.id}`);

    return { adminUser, staffUser };
  } catch (error) {
    console.error('Error seeding test database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// If this script is run directly, seed the database
if (require.main === module) {
  seedTestDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
