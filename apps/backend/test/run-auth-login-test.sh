#!/bin/bash
# Run only the auth login tests with verbose output

set -e
echo "=== Starting Authentication Login Tests ==="
echo "Current directory: $(pwd)"

cd "$(dirname "$0")/.."

# Clean up the database first
echo "=== Cleaning up the database ==="
cat > ./test/cleanup-db.ts << 'EOL'
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
EOL

NODE_ENV=test npx ts-node ./test/cleanup-db.ts

# Run the seed script to create fresh test users
echo "=== Running database seed script ==="
node -r ts-node/register ./test/seed.ts

echo "=== Running authentication login tests ==="
NODE_ENV=test npx jest --config ./jest.config.js --testRegex="auth.e2e-spec.ts$" -t "POST /api/auth/login" --verbose --detectOpenHandles
