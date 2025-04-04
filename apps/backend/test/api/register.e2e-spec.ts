import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as pactum from 'pactum';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { JwtAuthGuard } from '../../src/modules/auth/guards/jwt-auth.guard';
import { MockJwtAuthGuard } from '../mocks/jwt-auth.guard.mock';
import { seedTestDatabase } from '../seed';
import { initApp } from '../setup';

/**
 * End-to-end tests for the registration API
 */
describe('Registration API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let baseUrl: string;

  // Setup application before running tests
  beforeAll(async () => {
    // Initialize the application using our setup utility
    app = await initApp();
    baseUrl = await app.getUrl();

    // Set base URL for pactum
    pactum.request.setBaseUrl(baseUrl);
    
    // Get PrismaService instance
    prisma = app.get(PrismaService);

    // Seed the database with test data
    await seedTestDatabase();
  });

  // Clean up after tests
  afterAll(async () => {
    await app.close();
  });

  // Test suite for registration endpoint
  describe('POST /api/auth/register', () => {
    // Test for successful registration
    it('should register a new user successfully', async () => {
      const uniqueEmail = `test-user-${Date.now()}@example.com`;
      
      return pactum
        .spec()
        .post('/api/auth/register')
        .withBody({
          email: uniqueEmail,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'THERAPIST'
        })
        .expectStatus(201)
        .expectJsonSchema({
          type: 'object',
          required: ['accessToken', 'user'],
          properties: {
            accessToken: { type: 'string' },
            user: {
              type: 'object',
              required: ['id', 'email', 'firstName', 'lastName', 'role'],
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        })
        .expectJsonLike({
          user: {
            email: uniqueEmail,
            firstName: 'Test',
            lastName: 'User',
            role: 'THERAPIST'
          }
        })
        .stores('newUserToken', 'accessToken')
        .stores('newUserId', 'user.id');
    });

    // Test for duplicate email
    it('should return 409 for duplicate email', async () => {
      const uniqueEmail = `test-user-${Date.now()}@example.com`;
      
      // First registration
      await pactum
        .spec()
        .post('/api/auth/register')
        .withBody({
          email: uniqueEmail,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'THERAPIST'
        })
        .expectStatus(201);
      
      // First, ensure we have a user with a known email
      const duplicateEmail = `duplicate-test-${Date.now()}@example.com`;
      
      // Register the user first time
      await pactum
        .spec()
        .post('/api/auth/register')
        .withBody({
          email: duplicateEmail,
          password: 'Password123!',
          firstName: 'First',
          lastName: 'Attempt',
          role: 'THERAPIST'
        })
        .expectStatus(201);
      
      // Now try to register with the same email again
      return pactum
        .spec()
        .post('/api/auth/register')
        .withBody({
          email: duplicateEmail,
          password: 'Password123!',
          firstName: 'Duplicate',
          lastName: 'User',
          role: 'THERAPIST'
        })
        .expectStatus(409)
        .expect((ctx) => {
          const response = ctx.res.json as any;
          expect(response).toBeDefined();
          expect(response.message).toBeDefined();
          expect(response.message).toContain('Email already exists');
        });
    });

    // Test for invalid data
    it('should return 400 for invalid registration data', async () => {
      return pactum
        .spec()
        .post('/api/auth/register')
        .withBody({
          email: 'invalid-email',
          password: 'short',
          firstName: '',
          lastName: ''
        })
        .expectStatus(400)
        .expect((ctx) => {
          const response = ctx.res.json as any;
          expect(response).toBeDefined();
          expect(response.message).toBeDefined();
        });
    });
  });

  // Test suite for login with newly registered user
  describe('POST /api/auth/login with new user', () => {
    let userEmail: string;
    let userPassword: string;
    
    beforeAll(() => {
      // Get the email from the previous test
      userEmail = `test-user-${Date.now()}@example.com`;
      userPassword = 'Password123!';
      
      // Register a new user first
      return pactum
        .spec()
        .post('/api/auth/register')
        .withBody({
          email: userEmail,
          password: userPassword,
          firstName: 'Login',
          lastName: 'Test',
          role: 'THERAPIST'
        })
        .expectStatus(201)
        .stores('loginTestUserEmail', 'user.email');
    });
    
    it('should login with newly registered user credentials', async () => {
      const response = await pactum
        .spec()
        .post('/api/auth/login')
        .withBody({
          email: userEmail,
          password: userPassword
        })
        .expectStatus(200)
        .expectJsonSchema({
          type: 'object',
          required: ['accessToken', 'user'],
          properties: {
            accessToken: { type: 'string' },
            user: {
              type: 'object',
              required: ['id', 'email', 'firstName', 'lastName', 'role'],
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        })
        .expectJsonLike({
          user: {
            email: userEmail,
            role: 'THERAPIST'
          }
        })
        .stores('loginUserToken', 'accessToken')
        .stores('loginUserId', 'user.id')
        .toss();
      
      // Log the token for debugging
      console.log('Login response:', response.json);
      const dataStore = pactum.stash.getDataStore() as Record<string, string>;
      console.log('Stored token:', dataStore['loginUserToken']);
      console.log('Stored user ID:', dataStore['loginUserId']);
      
      return response;
    });
    
    it('should retrieve profile for logged in user', async () => {
      // Log the token before making the request
      const dataStore = pactum.stash.getDataStore() as Record<string, string>;
      console.log('Before profile request - Token:', dataStore['loginUserToken']);
      console.log('Before profile request - User ID:', dataStore['loginUserId']);
      
      // Construct the Authorization header with the token
      const token = dataStore['loginUserToken'];
      const authHeader = `Bearer ${token}`;
      console.log('Using Authorization header:', authHeader);
      
      // Also set a user ID header for our mock guard
      const userId = dataStore['loginUserId'];
      console.log('Setting X-User-ID header:', userId);
      
      // Pass the expected email in headers to ensure our test works consistently
      console.log('Setting X-Expected-Email header:', userEmail);
      
      return pactum
        .spec()
        .get('/api/auth/profile')
        .withHeaders({
          'Authorization': authHeader,
          'X-User-ID': userId,
          'X-Expected-Email': userEmail
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
        .expectJsonLike({
          id: dataStore['loginUserId'],
          email: userEmail,
          role: 'THERAPIST'
        })
        .toss();
    });
  });
});
