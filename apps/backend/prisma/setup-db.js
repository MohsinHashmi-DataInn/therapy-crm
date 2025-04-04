// Script to set up and seed the actual database
const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Create a new Prisma client
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database setup and seeding...');
  
  try {
    // Clean the database first
    console.log('Cleaning database tables...');
    await prisma.communication.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.waitlist.deleteMany({});
    await prisma.learner.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('Database cleaned successfully.');

    // Generate a secure password hash
    const adminPassword = 'Admin123!';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    console.log('Creating admin user...');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date(),
      },
    });

    console.log(`Admin user created with ID: ${admin.id}`);
    console.log('Admin login credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: Admin123!');

    // Create a staff user as well
    const staffPassword = 'Staff123!';
    const staffPasswordHash = await bcrypt.hash(staffPassword, saltRounds);

    console.log('Creating staff user...');
    const staff = await prisma.user.create({
      data: {
        email: 'staff@example.com',
        password: staffPasswordHash,
        firstName: 'Staff',
        lastName: 'User',
        role: UserRole.STAFF,
        isActive: true,
        createdAt: new Date(),
      },
    });

    console.log(`Staff user created with ID: ${staff.id}`);
    console.log('Staff login credentials:');
    console.log('Email: staff@example.com');
    console.log('Password: Staff123!');

    console.log('Database setup and seeding completed successfully!');
  } catch (error) {
    console.error('Error during database setup and seeding:');
    console.error(error);
    process.exit(1);
  } finally {
    // Disconnect from the database
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
