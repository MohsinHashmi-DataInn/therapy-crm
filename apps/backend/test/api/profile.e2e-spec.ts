/**
 * Profile API E2E Tests
 * Tests for the /api/auth/profile endpoint
 */
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as pactum from 'pactum';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AuthService } from '../../src/modules/auth/auth.service';
import { MockAuthService } from '../mocks/auth.service.mock';
import { JwtAuthGuard } from '../../src/modules/auth/guards/jwt-auth.guard';
import { MockJwtAuthGuard } from '../mocks/jwt-auth.guard.mock';
import { seedTestDatabase } from '../seed';

describe('Profile API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let baseUrl: string;

  beforeAll(async () => {
    // Seed the test database with test users
    await seedTestDatabase();
    
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
    // Override the real auth service with our mock for testing
    .overrideProvider(AuthService)
    .useClass(MockAuthService)
    // Override the JWT auth guard with our mock for testing
    .overrideGuard(JwtAuthGuard)
    .useClass(MockJwtAuthGuard)
    .compile();

    app = moduleFixture.createNestApplication();
    
    // Set global prefix to match the main application
    app.setGlobalPrefix('api');
    
    // Get the PrismaService instance for database operations
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();
    await app.listen(0); // Use a random available port
    
    // Configure pactum to use the NestJS application URL
    baseUrl = await app.getUrl();
    pactum.request.setBaseUrl(baseUrl);
    
    // Log the base URL for debugging
    console.log(`Test server running at: ${baseUrl}`);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/auth/profile', () => {
    it('should retrieve profile for authenticated user', async () => {
      // Create a mock user ID for testing
      const mockUserId = '12345';
      
      console.log('Testing profile endpoint with mock user ID:', mockUserId);
      
      return pactum
        .spec()
        .get('/api/auth/profile')
        .withHeaders({
          'Authorization': 'Bearer mock-token-for-testing',
          'X-User-ID': mockUserId
        })
        .expectStatus(200)
        .expectJsonSchema({
          type: 'object',
          required: ['id', 'email', 'firstName', 'lastName', 'role'],
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' }
          }
        })
        .toss();
    });
  });
});
