#!/bin/bash

# Run the API tests with Pactum
echo "Running API tests with Pactum..."
cd "$(dirname "$0")/.."
npm run test:api
