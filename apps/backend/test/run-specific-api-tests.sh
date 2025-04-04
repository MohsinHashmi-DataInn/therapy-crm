#!/bin/bash

# Set environment variables for test
export NODE_ENV=test

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if module name was provided
if [ "$#" -eq 0 ]; then
  echo -e "${RED}Error: Please provide at least one module name to test${NC}"
  echo -e "Usage: $0 <module_name1> [module_name2] [module_name3] ..."
  echo -e "Available modules: health, auth, user, client, appointment, learner, waitlist, communication"
  exit 1
fi

echo -e "\n${YELLOW}=== Running specific API E2E tests ===${NC}\n"

# Run seed script to ensure database is ready
echo -e "${YELLOW}Ensuring database is properly seeded...${NC}"
npm run seed:test

# Initialize counters
total_tests=0
passed_tests=0
failed_tests=0

# Run tests for each provided module
for module in "$@"; do
  test_file="${module}.e2e-spec.ts"
  
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
