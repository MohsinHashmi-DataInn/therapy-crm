// Custom script to handle Prisma client generation
const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Starting Prisma client generation...');
  
  // Define paths explicitly
  const schemaPath = path.resolve(__dirname, 'prisma/schema.prisma');
  console.log(`Schema path: ${schemaPath}`);
  
  // Run the Prisma generate command with explicit path
  execSync(`npx prisma generate --schema="${schemaPath}"`, { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('Prisma client generation completed successfully');
} catch (error) {
  console.error('Error during Prisma client generation:', error.message);
  process.exit(1);
}
