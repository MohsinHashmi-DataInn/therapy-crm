// Script to update the .env file with the correct database credentials
const fs = require('fs');
const path = require('path');

// Path to the .env file
const envPath = path.join(__dirname, '.env');

// Read the current .env file
fs.readFile(envPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading .env file:', err);
    process.exit(1);
  }

  // Update the DATABASE_URL with the provided credentials
  // Modify these values to match your PostgreSQL setup
  const username = 'postgres';
  const password = 'postgres'; // Update this with your actual password
  const host = 'localhost';
  const port = '5432';
  const dbName = 'therapy_crm';

  // Create the new connection string
  const newDbUrl = `postgresql://${username}:${password}@${host}:${port}/${dbName}?schema=public`;
  
  // Replace the DATABASE_URL line in the .env file
  const updatedEnv = data.replace(
    /DATABASE_URL=.*/,
    `DATABASE_URL="${newDbUrl}"`
  );

  // Write the updated content back to the .env file
  fs.writeFile(envPath, updatedEnv, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error('Error writing to .env file:', writeErr);
      process.exit(1);
    }
    
    console.log('Successfully updated DATABASE_URL in .env file');
    console.log(`New connection string: ${newDbUrl}`);
    console.log('\nYou can now run:');
    console.log('1. npx prisma migrate dev --name init');
    console.log('2. node prisma/setup-db.js');
  });
});
