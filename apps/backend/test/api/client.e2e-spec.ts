/**
 * Client API E2E Tests
 * Tests for the /api/clients endpoints
 */
import { INestApplication } from '@nestjs/common';
import * as pactum from 'pactum';
import { initApp } from '../setup';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { CreateClientDto, ClientStatus } from '../../src/modules/client/dto/create-client.dto';
import { UpdateClientDto } from '../../src/modules/client/dto/update-client.dto';

// User role enum to match the one in the controller
enum UserRole {
  ADMIN = 'ADMIN',
  THERAPIST = 'THERAPIST',
  STAFF = 'STAFF'
}

describe('Client API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let staffToken: string;
  let therapistToken: string;
  let clientId: string;

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

    // For therapist tests, we'll use the mock token
    therapistToken = 'mock-therapist-token-789';
  });

  // Clean up after all tests
  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/clients (Create Client)', () => {
    const dto: CreateClientDto = {
      firstName: 'Test',
      lastName: 'Client',
      email: `test-client-${Date.now()}@example.com`,
      phone: '555-123-4567',
      address: '123 Test St, Testville, TS 12345',
      status: ClientStatus.ACTIVE,
      notes: 'Test client created for E2E testing'
    };

    it('should create a new client when admin token is provided', async () => {
      const response = await pactum
        .spec()
        .post('/api/clients')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .withBody(dto)
        .expectStatus(201);

      // Store client ID for later tests
      clientId = response.body.id;
      
      // Expect response to have required client fields
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('firstName', dto.firstName);
      expect(response.body).toHaveProperty('lastName', dto.lastName);
      expect(response.body).toHaveProperty('email', dto.email);
    });

    it('should create a new client when staff token is provided', async () => {
      const staffDto = {
        ...dto,
        email: `staff-created-client-${Date.now()}@example.com`
      };

      await pactum
        .spec()
        .post('/api/clients')
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .withBody(staffDto)
        .expectStatus(201)
        .expectJsonLike({
          firstName: staffDto.firstName,
          lastName: staffDto.lastName,
          email: staffDto.email
        });
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .post('/api/clients')
        .withBody(dto)
        .expectStatus(401);
    });

    it('should return 400 for invalid data', async () => {
      await pactum
        .spec()
        .post('/api/clients')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .withBody({
          // Missing required fields
          firstName: 'Incomplete'
        })
        .expectStatus(400);
    });
  });

  describe('GET /api/clients (Find All Clients)', () => {
    it('should return list of clients when admin token is provided', async () => {
      await pactum
        .spec()
        .get('/api/clients')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(200)
        .expectJsonLike([
          {
            id: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
            email: expect.any(String)
          }
        ])
        .expect((ctx) => {
          const clients = ctx.res.json as any[];
          expect(Array.isArray(clients)).toBeTruthy();
          expect(clients.length).toBeGreaterThan(0);
        });
    });

    it('should return list of clients when staff token is provided', async () => {
      await pactum
        .spec()
        .get('/api/clients')
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .expectStatus(200)
        .expect((ctx) => {
          const clients = ctx.res.json as any[];
          expect(Array.isArray(clients)).toBeTruthy();
        });
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .get('/api/clients')
        .expectStatus(401);
    });
  });

  describe('GET /api/clients/:id (Find One Client)', () => {
    it('should return a client by ID when admin token is provided', async () => {
      await pactum
        .spec()
        .get(`/api/clients/${clientId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(200)
        .expectJsonLike({
          id: clientId,
          firstName: expect.any(String),
          lastName: expect.any(String),
          email: expect.any(String)
        });
    });

    it('should return a client by ID when staff token is provided', async () => {
      await pactum
        .spec()
        .get(`/api/clients/${clientId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .expectStatus(200);
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .get(`/api/clients/${clientId}`)
        .expectStatus(401);
    });

    it('should return 404 for non-existent client ID', async () => {
      await pactum
        .spec()
        .get('/api/clients/999999')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(404);
    });
  });

  describe('PATCH /api/clients/:id (Update Client)', () => {
    const updateDto: UpdateClientDto = {
      firstName: 'Updated',
      lastName: 'Client',
      notes: 'Updated client notes for E2E testing'
    };

    it('should update a client when admin token is provided', async () => {
      await pactum
        .spec()
        .patch(`/api/clients/${clientId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .withBody(updateDto)
        .expectStatus(200)
        .expectJsonLike({
          id: clientId,
          firstName: updateDto.firstName,
          lastName: updateDto.lastName,
          notes: updateDto.notes
        });
    });

    it('should update a client when staff token is provided', async () => {
      const staffUpdateDto = {
        notes: 'Staff updated these notes'
      };

      await pactum
        .spec()
        .patch(`/api/clients/${clientId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .withBody(staffUpdateDto)
        .expectStatus(200)
        .expectJsonLike({
          id: clientId,
          notes: staffUpdateDto.notes
        });
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .patch(`/api/clients/${clientId}`)
        .withBody(updateDto)
        .expectStatus(401);
    });
  });

  describe('DELETE /api/clients/:id (Remove Client)', () => {
    it('should return 403 when staff token is provided', async () => {
      await pactum
        .spec()
        .delete(`/api/clients/${clientId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .expectStatus(403);
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .delete(`/api/clients/${clientId}`)
        .expectStatus(401);
    });

    it('should delete a client when admin token is provided', async () => {
      await pactum
        .spec()
        .delete(`/api/clients/${clientId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(200);

      // Verify client no longer exists
      await pactum
        .spec()
        .get(`/api/clients/${clientId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(404);
    });
  });
});
