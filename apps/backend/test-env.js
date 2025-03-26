// Simple script to check if DATABASE_URL is properly configured
require('dotenv').config();
console.log('Database URL:', process.env.DATABASE_URL || 'Not set');
