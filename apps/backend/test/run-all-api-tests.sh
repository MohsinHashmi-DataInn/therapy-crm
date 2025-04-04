#!/bin/bash

# Set environment variables for test
export NODE_ENV=test

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}=== Running all API E2E tests ===${NC}\n"

# Run seed script to ensure database is ready
echo -e "${YELLOW}Ensuring database is properly seeded...${NC}"
npm run seed:test

# Define array of test file patterns
test_files=(
  "health.e2e-spec.ts"
  "auth.e2e-spec.ts"
  "user.e2e-spec.ts"
  "client.e2e-spec.ts"
  "appointment.e2e-spec.ts"
  "learner.e2e-spec.ts"
  "waitlist.e2e-spec.ts"
  "communication.e2e-spec.ts"
)

# Initialize counters
total_tests=0
passed_tests=0
failed_tests=0

# Run tests for each file
for test_file in "${test_files[@]}"; do
  echo -e "\n${YELLOW}Running tests for: ${test_file}${NC}"
  
  # Run the test using Jest
  npx jest --config ./jest.config.js --testRegex="${test_file}$" --verbose
  
  # Capture exit code
  exit_code=$?
  
  # Update counters
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✓ Tests for ${test_file} PASSED${NC}"
    ((passed_tests++))
  else
    echo -e "${RED}✗ Tests for ${test_file} FAILED${NC}"
    ((failed_tests++))
  fi
  
  ((total_tests++))
done

# Print summary
echo -e "\n${YELLOW}=== Test Summary ===${NC}"
echo -e "Total test suites: ${total_tests}"
echo -e "${GREEN}Passed: ${passed_tests}${NC}"
if [ $failed_tests -gt 0 ]; then
  echo -e "${RED}Failed: ${failed_tests}${NC}"
else
  echo -e "Failed: ${failed_tests}"
fi

# Exit with appropriate code
if [ $failed_tests -gt 0 ]; then
  echo -e "\n${RED}Some test suites failed!${NC}"
  exit 1
else
  echo -e "\n${GREEN}All test suites passed!${NC}"
  exit 0
fi
