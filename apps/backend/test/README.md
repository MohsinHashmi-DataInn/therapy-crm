# Therapy CRM E2E Testing Suite

This directory contains end-to-end (E2E) test suites for the Therapy CRM API endpoints. The tests are designed to verify that all API endpoints function correctly, validate input data appropriately, and enforce authorization rules.

## Test Structure

The test suite is organized into separate modules, each testing a specific API:

- **Health API**: Basic health check endpoint
- **Auth API**: Authentication-related endpoints (login, register, profile)
- **User API**: User management endpoints
- **Client API**: Client management endpoints
- **Appointment API**: Appointment scheduling endpoints
- **Learner API**: Learner data management endpoints
- **Waitlist API**: Waitlist entry management endpoints
- **Communication API**: Client communication management endpoints

## Running Tests

### Running All Tests

To run all E2E tests at once, use the provided shell script:

```bash
./test/run-all-api-tests.sh
```

### Running Specific Tests

To run tests for specific API modules, use the provided shell script with module names as arguments:

```bash
./test/run-specific-api-tests.sh user client appointment
```

This will run only the tests for the specified modules.

### Running Tests via NPM

You can also run tests using npm commands:

```bash
# Run all tests
npm run test:e2e

# Run a specific test file
npx jest --config ./jest.config.js --testRegex="user.e2e-spec.ts$" --verbose
```

## Test Setup

The tests utilize:

- **Pactum**: API testing tool for making HTTP requests and assertions
- **Jest**: Testing framework for running tests and making assertions
- **Prisma**: ORM for database interactions

Each test suite follows a similar pattern:

1. Setup the application with `initApp()` before all tests
2. Authenticate with the API to get tokens for protected routes
3. Test each endpoint with various scenarios (success, validation errors, auth errors)
4. Clean up resources after tests complete

## Extending the Test Suite

When adding new API endpoints or modules, create new test files following the existing patterns:

1. Create a new file named `your-module.e2e-spec.ts` in the `test/api` directory
2. Import necessary dependencies and DTOs
3. Initialize the app and get authentication tokens in the `beforeAll` hook
4. Group tests by endpoint using `describe` blocks
5. Test all possible scenarios, including:
   - Successful operations
   - Authentication errors (401)
   - Authorization errors (403)
   - Validation errors (400)
   - Not found errors (404)

## Best Practices

1. **Isolation**: Each test should be independent of others
2. **Clean up**: Remove test data after tests complete
3. **Coverage**: Test all endpoints and possible scenarios
4. **Authentication**: Test with different user roles (admin, staff, etc.)
5. **Assertions**: Make specific assertions about response bodies, not just status codes

## Test Data

Tests use test data that is seeded to the database before tests run. The seed script creates:

- Admin users for admin-level tests
- Staff users for staff-level tests
- Test data for various entities (clients, appointments, etc.)

This data is reset between test runs to ensure test isolation.
