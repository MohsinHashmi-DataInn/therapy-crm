#!/usr/bin/env node

/**
 * A simplified script to generate the Prisma client
 * This uses Prisma's JavaScript API directly to avoid path resolution issues
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the absolute path to the schema file
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

// Verify the schema file exists
if (!fs.existsSync(schemaPath)) {
  console.error(`Error: Schema file not found at ${schemaPath}`);
  process.exit(1);
}

console.log(`Using schema file at: ${schemaPath}`);

// Execute prisma generate with the verified schema path
const result = spawnSync('npx', ['prisma', 'generate', '--schema', schemaPath], {
  stdio: 'inherit',
  env: process.env
});

if (result.error) {
  console.error('Error executing prisma generate:', result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`Prisma generate failed with exit code ${result.status}`);
  process.exit(result.status);
}

console.log('Prisma client generated successfully');
