/**
 * Test setup configuration
 * Configures the test environment and provides utility functions for testing
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import { seedTestDatabase } from './seed';
import { AuthService } from '../src/modules/auth/auth.service';
import { MockAuthService } from './mocks/auth.service.mock';
import { AuthController } from '../src/modules/auth/auth.controller';
import { MockAuthController } from './mocks/auth.controller.mock';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { MockJwtAuthGuard } from './mocks/jwt-auth.guard.mock';

/**
 * Initialize the NestJS application for testing
 * @returns A configured NestJS application instance
 */
export const initApp = async (): Promise<INestApplication> => {
  // Seed the test database with test users
  await seedTestDatabase();
  
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
  // Override the real auth service with our mock for testing
  .overrideProvider(AuthService)
  .useClass(MockAuthService)
  // Override the JWT auth guard with our mock for testing
  .overrideGuard(JwtAuthGuard)
  .useClass(MockJwtAuthGuard)
  .compile();

  const app = moduleFixture.createNestApplication();
  
  // Set global prefix to match the main application
  app.setGlobalPrefix('api');
  
  // Apply global pipes for validation, matching the main application setup
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  await app.init();
  await app.listen(0); // Use a random available port
  
  // Configure pactum to use the NestJS application URL with the API prefix
  const url = await app.getUrl();
  pactum.request.setBaseUrl(url);
  
  // Log the base URL for debugging
  console.log(`Test server running at: ${url}`);
  
  // The NestJS application uses a global prefix of 'api'
  // but our tests are already including this in the paths
  // so we don't need to modify the paths in our tests
  
  return app;
};

/**
 * Test user credentials for authentication tests
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'ADMIN',
  },
  staff: {
    email: 'staff@example.com',
    password: 'Staff123!',
    role: 'STAFF',
  },
  invalid: {
    email: 'nonexistent@example.com',
    password: 'WrongPassword123',
  },
};

/**
 * Helper function to get an authentication token for test users
 * @param userType The type of test user to authenticate
 * @returns A promise that resolves to the authentication token
 */
export const getAuthToken = async (userType: keyof typeof TEST_USERS): Promise<string> => {
  const user = TEST_USERS[userType];
  
  const response = await pactum
    .spec()
    .post('/api/auth/login')
    .withJson({
      email: user.email,
      password: user.password,
    })
    .expectStatus(200)
    .returns('accessToken');
    
  return response;
};
