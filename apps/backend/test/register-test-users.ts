/**
 * Script to register test users through the API
 * This ensures passwords are hashed correctly for testing
 */
import { PrismaClient } from '@prisma/client';
import { TEST_USERS } from './setup';
import { UserRole } from '../src/modules/auth/guards/roles.guard';
import axios from 'axios';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Register test users through the API
 */
export const registerTestUsers = async (baseUrl: string): Promise<void> => {
  try {
    console.log('Registering test users through API...');

    // First, clean up existing test users to avoid conflicts
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [TEST_USERS.admin.email, TEST_USERS.staff.email],
        },
      },
    });

    console.log('Existing test users deleted');

    // Register admin user
    await axios.post(`${baseUrl}/api/auth/register`, {
      email: TEST_USERS.admin.email,
      password: TEST_USERS.admin.password,
      firstName: 'Admin',
      lastName: 'User',
      role: TEST_USERS.admin.role,
    }).catch(error => {
      console.error('Failed to register admin user:', error.response?.data || error.message);
      throw error;
    });

    console.log('Admin user registered successfully');

    // Register staff user
    await axios.post(`${baseUrl}/api/auth/register`, {
      email: TEST_USERS.staff.email,
      password: TEST_USERS.staff.password,
      firstName: 'Staff',
      lastName: 'User',
      role: TEST_USERS.staff.role,
    }).catch(error => {
      console.error('Failed to register staff user:', error.response?.data || error.message);
      throw error;
    });

    console.log('Staff user registered successfully');

    console.log('Test users registered successfully');
  } catch (error) {
    console.error('Error registering test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// If this script is run directly, execute the registration
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  registerTestUsers(baseUrl)
    .then(() => console.log('Done'))
    .catch(error => {
      console.error('Registration failed:', error);
      process.exit(1);
    });
}
