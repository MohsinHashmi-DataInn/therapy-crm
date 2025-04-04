/**
 * Waitlist API E2E Tests
 * Tests for the /api/waitlist endpoints
 */
import { INestApplication } from '@nestjs/common';
import * as pactum from 'pactum';
import { initApp } from '../setup';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { CreateWaitlistDto, ServiceType, WaitlistStatus } from '../../src/modules/waitlist/dto/create-waitlist.dto';
import { UpdateWaitlistDto } from '../../src/modules/waitlist/dto/update-waitlist.dto';

describe('Waitlist API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let staffToken: string;
  let waitlistId: string;
  let testClientId: string;

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
    
    // Create a test client for waitlist entries
    const clientResponse = await pactum
      .spec()
      .post('/api/clients')
      .withHeaders({
        Authorization: `Bearer ${adminToken}`
      })
      .withBody({
        firstName: 'Waitlist',
        lastName: 'TestClient',
        email: `waitlist-client-${Date.now()}@example.com`,
        phone: '555-123-4567',
        address: '123 Waitlist St',
        city: 'Testville',
        state: 'TS',
        zipCode: '12345',
        dateOfBirth: new Date('1990-01-01').toISOString()
      })
      .expectStatus(201);

    testClientId = clientResponse.body.id;

    // Tokens have already been set above
  });

  // Clean up after all tests
  afterAll(async () => {
    // Try to clean up the test client
    try {
      await pactum
        .spec()
        .delete(`/api/clients/${testClientId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        });
    } catch (error) {
      console.error('Failed to clean up test client:', error);
    }

    await app.close();
  });

  describe('POST /api/waitlist (Create Waitlist Entry)', () => {
    const dto: CreateWaitlistDto = {
      serviceType: ServiceType.SPEECH_THERAPY,
      clientId: testClientId,
      status: WaitlistStatus.WAITING,
      requestDate: new Date().toISOString(),
      preferredSchedule: 'Weekday mornings',
      notes: 'Test waitlist entry created for E2E testing'
    };

    it('should create a new waitlist entry when admin token is provided', async () => {
      const response = await pactum
        .spec()
        .post('/api/waitlist')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .withBody(dto)
        .expectStatus(201);

      // Store waitlist ID for later tests
      waitlistId = response.body.id;
      
      // Expect response to have required waitlist fields
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('serviceType', dto.serviceType);
      expect(response.body).toHaveProperty('clientId', dto.clientId);
      expect(response.body).toHaveProperty('status', dto.status);
      expect(response.body).toHaveProperty('requestDate');
      expect(response.body).toHaveProperty('notes', dto.notes);
    });

    it('should create a new waitlist entry when staff token is provided', async () => {
      const staffDto: CreateWaitlistDto = {
        serviceType: ServiceType.OCCUPATIONAL_THERAPY,
        clientId: testClientId,
        status: WaitlistStatus.WAITING,
        requestDate: new Date().toISOString(),
        preferredSchedule: 'Weekend afternoons',
        notes: 'Staff created waitlist entry for E2E testing'
      };

      await pactum
        .spec()
        .post('/api/waitlist')
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .withBody(staffDto)
        .expectStatus(201)
        .expectJsonLike({
          serviceType: staffDto.serviceType,
          clientId: staffDto.clientId,
          status: staffDto.status,
          notes: staffDto.notes
        });
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .post('/api/waitlist')
        .withBody(dto)
        .expectStatus(401);
    });

    it('should return 400 for invalid data', async () => {
      await pactum
        .spec()
        .post('/api/waitlist')
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

  describe('GET /api/waitlist (Find All Waitlist Entries)', () => {
    it('should return list of waitlist entries when admin token is provided', async () => {
      await pactum
        .spec()
        .get('/api/waitlist')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(200)
        .expectJsonLike([{
            id: expect.any(String),
            serviceType: expect.any(String),
            clientId: expect.any(String),
            status: expect.any(String)
          }])
        .expect((ctx) => {
          const waitlistEntries = ctx.res.json as any[];
          expect(Array.isArray(waitlistEntries)).toBeTruthy();
          expect(waitlistEntries.length).toBeGreaterThan(0);
        });
    });

    it('should return list of waitlist entries when staff token is provided', async () => {
      await pactum
        .spec()
        .get('/api/waitlist')
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .expectStatus(200)
        .expect((ctx) => {
          const waitlistEntries = ctx.res.json as any[];
          expect(Array.isArray(waitlistEntries)).toBeTruthy();
        });
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .get('/api/waitlist')
        .expectStatus(401);
    });
  });

  describe('GET /api/waitlist/:id (Find One Waitlist Entry)', () => {
    it('should return a waitlist entry by ID when admin token is provided', async () => {
      await pactum
        .spec()
        .get(`/api/waitlist/${waitlistId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(200)
        .expectJsonLike({
          id: waitlistId,
          serviceType: expect.any(String),
          clientId: expect.any(String),
          status: expect.any(String)
        });
    });

    it('should return a waitlist entry by ID when staff token is provided', async () => {
      await pactum
        .spec()
        .get(`/api/waitlist/${waitlistId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .expectStatus(200);
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .get(`/api/waitlist/${waitlistId}`)
        .expectStatus(401);
    });

    it('should return 404 for non-existent waitlist ID', async () => {
      await pactum
        .spec()
        .get('/api/waitlist/999999')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(404);
    });
  });

  describe('PATCH /api/waitlist/:id (Update Waitlist Entry)', () => {
    const updateDto: UpdateWaitlistDto = {
      status: WaitlistStatus.CONTACTED,
      notes: 'Updated waitlist notes for E2E testing',
      preferredSchedule: 'Updated schedule preferences'
    };

    it('should update a waitlist entry when admin token is provided', async () => {
      await pactum
        .spec()
        .patch(`/api/waitlist/${waitlistId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .withBody(updateDto)
        .expectStatus(200)
        .expectJsonLike({
          id: waitlistId,
          status: updateDto.status,
          notes: updateDto.notes,
          preferredSchedule: updateDto.preferredSchedule
        });
    });

    it('should update a waitlist entry when staff token is provided', async () => {
      const staffUpdateDto = {
        status: 'SCHEDULED',
        notes: 'Staff updated these notes'
      };

      await pactum
        .spec()
        .patch(`/api/waitlist/${waitlistId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .withBody(staffUpdateDto)
        .expectStatus(200)
        .expectJsonLike({
          id: waitlistId,
          status: staffUpdateDto.status,
          notes: staffUpdateDto.notes
        });
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .patch(`/api/waitlist/${waitlistId}`)
        .withBody(updateDto)
        .expectStatus(401);
    });
  });

  describe('DELETE /api/waitlist/:id (Remove Waitlist Entry)', () => {
    it('should return 403 when staff token is provided', async () => {
      await pactum
        .spec()
        .delete(`/api/waitlist/${waitlistId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .expectStatus(403);
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .delete(`/api/waitlist/${waitlistId}`)
        .expectStatus(401);
    });

    it('should delete a waitlist entry when admin token is provided', async () => {
      await pactum
        .spec()
        .delete(`/api/waitlist/${waitlistId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(200);

      // Verify waitlist entry no longer exists
      await pactum
        .spec()
        .get(`/api/waitlist/${waitlistId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(404);
    });
  });
});
