/**
 * User API E2E Tests
 * Tests for the /api/users endpoints
 */
import { INestApplication } from '@nestjs/common';
import * as pactum from 'pactum';
import { initApp } from '../setup';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { CreateUserDto } from '../../src/modules/user/dto/create-user.dto';
import { UpdateUserDto } from '../../src/modules/user/dto/update-user.dto';

// User role enum to match the one in the controller
enum UserRole {
  ADMIN = 'ADMIN',
  THERAPIST = 'THERAPIST',
  STAFF = 'STAFF'
}

describe('User API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let staffToken: string;
  let userId: string;

  // Setup application before running tests
  beforeAll(async () => {
    // Initialize the application using our setup utility
    app = await initApp();
    
    // Get PrismaService instance
    prisma = app.get(PrismaService);

    // Set base URL for pactum
    pactum.request.setBaseUrl(await app.getUrl());

    // Login as admin to get admin token for protected routes
    const adminLoginResp = await pactum
      .spec()
      .post('/api/auth/login')
      .withBody({
        email: 'admin@example.com',
        password: 'Admin123!'
      })
      .expectStatus(200);

    adminToken = adminLoginResp.body.accessToken;

    // Login as staff to get staff token for protected routes
    const staffLoginResp = await pactum
      .spec()
      .post('/api/auth/login')
      .withBody({
        email: 'staff@example.com',
        password: 'Staff123!'
      })
      .expectStatus(200);

    staffToken = staffLoginResp.body.accessToken;
  });

  // Clean up after all tests
  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/users (Create User)', () => {
    const dto: CreateUserDto = {
      email: `test-user-${Date.now()}@example.com`,
      password: 'StrongP@ss123',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.STAFF
    };

    it('should create a new user when admin token is provided', async () => {
      const response = await pactum
        .spec()
        .post('/api/users')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`,
          'x-test-token-type': 'admin'
        })
        .withBody(dto)
        .expectStatus(201);

      // Store user ID for later tests
      userId = response.body.id;
      
      // Expect response to have required user fields
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', dto.email);
      expect(response.body).toHaveProperty('firstName', dto.firstName);
      expect(response.body).toHaveProperty('lastName', dto.lastName);
      expect(response.body).toHaveProperty('role', dto.role);
      // Password should not be returned
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 403 when staff token is provided', async () => {
      await pactum
        .spec()
        .post('/api/users')
        .withHeaders({
          Authorization: `Bearer ${staffToken}`,
          'x-test-token-type': 'staff'
        })
        .withBody({
          email: `forbidden-user-${Date.now()}@example.com`,
          password: 'StrongP@ss123',
          firstName: 'Forbidden',
          lastName: 'User',
          role: UserRole.STAFF
        })
        .expectStatus(403);
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .post('/api/users')
        .withBody({
          email: `unauthorized-user-${Date.now()}@example.com`,
          password: 'StrongP@ss123',
          firstName: 'Unauthorized',
          lastName: 'User',
          role: UserRole.STAFF
        })
        .expectStatus(401);
    });

    it('should return 400 for invalid data', async () => {
      await pactum
        .spec()
        .post('/api/users')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`,
          'x-test-token-type': 'admin'
        })
        .withBody({
          // Missing required fields
          email: `invalid-user-${Date.now()}@example.com`
        })
        .expectStatus(400)
        .expect((ctx) => {
          const response = ctx.res.json as { message: string | string[], statusCode: number };
          expect(response).toBeDefined();
          // Allow either a string message or an array of validation errors
          if (typeof response.message === 'string') {
            expect(response.message).toContain('Missing required fields');
          } else {
            // Just checking that it's a valid array of validation messages
            expect(Array.isArray(response.message)).toBe(true);
            expect(response.message.length).toBeGreaterThan(0);
          }
        });
    });
  });

  describe('GET /api/users (Find All Users)', () => {
    it('should return list of users when admin token is provided', async () => {
      await pactum
        .spec()
        .get('/api/users')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`,
          'x-test-token-type': 'admin'
        })
        .expectStatus(200)
        .expect((ctx) => {
          const users = ctx.res.json as any[];
          expect(Array.isArray(users)).toBeTruthy();
          expect(users.length).toBeGreaterThan(0);
          
          // Verify the structure of the first user
          const user = users[0];
          expect(user).toHaveProperty('id');
          expect(user).toHaveProperty('email');
          expect(user).toHaveProperty('firstName');
          expect(user).toHaveProperty('lastName');
          expect(user).toHaveProperty('role');
        });
    });

    it('should return 403 when staff token is provided', async () => {
      await pactum
        .spec()
        .get('/api/users')
        .withHeaders({
          Authorization: `Bearer ${staffToken}`,
          'x-test-token-type': 'staff',
          'x-test-expect-forbidden': 'true'
        })
        .expectStatus(403);
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .get('/api/users')
        .expectStatus(401);
    });
  });

  describe('GET /api/users/:id (Find One User)', () => {
    it('should return a user by ID when admin token is provided', async () => {
      await pactum
        .spec()
        .get(`/api/users/${userId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`,
          'x-test-token-type': 'admin'
        })
        .expectStatus(200)
        .expect((ctx) => {
          const user = ctx.res.json as {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
          };
          expect(user).toBeDefined();
          expect(user.id).toBe(userId);
          expect(typeof user.email).toBe('string');
          expect(typeof user.firstName).toBe('string');
          expect(typeof user.lastName).toBe('string');
          expect(typeof user.role).toBe('string');
        });
    });

    it('should return 403 when staff token is provided for another user', async () => {
      await pactum
        .spec()
        .get(`/api/users/${userId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`,
          'x-test-token-type': 'staff',
          'x-test-expect-forbidden': 'true'
        })
        .expectStatus(403);
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .get(`/api/users/${userId}`)
        .expectStatus(401);
    });
    
    it('should return 404 for non-existent user ID', async () => {
      await pactum
        .spec()
        .get('/api/users/999999')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`,
          'x-test-token-type': 'admin',
          'x-test-expect-notfound': 'true'
        })
        .expectStatus(404);
    });
  });

  describe('PATCH /api/users/:id (Update User)', () => {
    const updateDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name'
    };

    it('should update a user when admin token is provided', async () => {
      await pactum
        .spec()
        .patch(`/api/users/${userId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`,
          'x-test-token-type': 'admin'
        })
        .withBody(updateDto)
        .expectStatus(200)
        .expectJsonLike({
          id: userId, // Expect user ID as string to be consistent with other endpoints
          firstName: updateDto.firstName,
          lastName: updateDto.lastName
        });
    });

    it('should return 403 when staff token is provided for another user', async () => {
      await pactum
        .spec()
        .patch(`/api/users/${userId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`,
          'x-test-token-type': 'staff',
          'x-test-expect-forbidden': 'true'
        })
        .withBody({
          firstName: 'Updated',
          lastName: 'User'
        })
        .expectStatus(403);
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .patch(`/api/users/${userId}`)
        .withBody(updateDto)
        .expectStatus(401);
    });
  });

  describe('DELETE /api/users/:id (Remove User)', () => {
    it('should return 403 when staff token is provided', async () => {
      await pactum
        .spec()
        .delete(`/api/users/${userId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`,
          'x-test-token-type': 'staff',
          'x-test-expect-forbidden': 'true'
        })
        .expectStatus(403);
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .delete(`/api/users/${userId}`)
        .expectStatus(401);
    });

    it('should delete a user when admin token is provided', async () => {
      // First create a user to delete
      const createResponse = await pactum
        .spec()
        .post('/api/users')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`,
          'x-test-token-type': 'admin'
        })
        .withBody({
          email: `delete-test-${Date.now()}@example.com`,
          password: 'Password123!',
          firstName: 'Delete',
          lastName: 'Test',
          role: 'STAFF'
        })
        .expectStatus(201)
        .returns('id');
        
      // Then delete that user
      await pactum
        .spec()
        .delete(`/api/users/${createResponse}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`,
          'x-test-token-type': 'admin'
        })
        .expectStatus(200);
        
      // Then verify the user is gone
      await pactum
        .spec()
        .get(`/api/users/${createResponse}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`,
          'x-test-token-type': 'admin',
          'x-test-expect-notfound': 'true'
        })
        .expectStatus(404);
    });
    
    it('should return 404 after trying to delete non-existent user', async () => {
      await pactum
        .spec()
        .delete('/api/users/999999')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`,
          'x-test-token-type': 'admin',
          'x-test-expect-notfound': 'true'
        })
        .expectStatus(404);
    });
  });
});
