/**
 * Learner API E2E Tests
 * Tests for the /api/learners endpoints
 */
import { INestApplication } from '@nestjs/common';
import * as pactum from 'pactum';
import { initApp } from '../setup';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { CreateLearnerDto } from '../../src/modules/learner/dto/create-learner.dto';
import { LearnerStatus } from '../../src/types/prisma-models';
import { UpdateLearnerDto } from '../../src/modules/learner/dto/update-learner.dto';
import { UserRole } from '../../src/modules/auth/guards/roles.guard';

describe('Learner API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let staffToken: string;
  let learnerId: string;
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

    // Create a client first (since learners need to be associated with a client)
    const clientResponse = await pactum
      .spec()
      .post('/api/clients')
      .withHeaders({
        Authorization: `Bearer ${adminToken}`
      })
      .withBody({
        firstName: 'Parent',
        lastName: 'Test',
        email: `parent-${Date.now()}@example.com`,
        phone: '555-987-6543',
        address: '123 Parent St, Parentville, TS 67890'
      })
      .expectStatus(201);

    clientId = clientResponse.body.id;

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
    const therapistToken = 'mock-therapist-token-789';
  });

  // Clean up after all tests
  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/learners (Create Learner)', () => {
    const dto: CreateLearnerDto = {
      firstName: 'Test',
      lastName: 'Learner',
      dateOfBirth: new Date('2010-01-01').toISOString(),
      gender: 'Male',
      course: 'Speech Therapy',
      schedule: 'Monday and Wednesday afternoons',
      status: LearnerStatus.ACTIVE,
      notes: 'Test learner created for E2E testing',
      clientId: clientId
    };

    it('should create a new learner when admin token is provided', async () => {
      const response = await pactum
        .spec()
        .post('/api/learners')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .withBody(dto)
        .expectStatus(201);

      // Store learner ID for later tests
      learnerId = response.body.id;
      
      // Expect response to have required learner fields
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('firstName', dto.firstName);
      expect(response.body).toHaveProperty('lastName', dto.lastName);
    });

    it('should create a new learner when staff token is provided', async () => {
      const staffDto = {
        ...dto,
        email: `staff-created-learner-${Date.now()}@example.com`,
        parentGuardianEmail: `staff-parent-${Date.now()}@example.com`
      };

      await pactum
        .spec()
        .post('/api/learners')
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .withBody(staffDto)
        .expectStatus(201)
        .expectJsonLike({
          firstName: staffDto.firstName,
          lastName: staffDto.lastName,
          email: staffDto.email,
        });
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .post('/api/learners')
        .withBody(dto)
        .expectStatus(401);
    });

    it('should return 400 for invalid data', async () => {
      await pactum
        .spec()
        .post('/api/learners')
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

  describe('GET /api/learners (Find All Learners)', () => {
    it('should return list of learners when admin token is provided', async () => {
      await pactum
        .spec()
        .get('/api/learners')
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
          const learners = ctx.res.json as any[];
          expect(Array.isArray(learners)).toBeTruthy();
          expect(learners.length).toBeGreaterThan(0);
        });
    });

    it('should return list of learners when staff token is provided', async () => {
      await pactum
        .spec()
        .get('/api/learners')
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .expectStatus(200)
        .expect((ctx) => {
          const learners = ctx.res.json as any[];
          expect(Array.isArray(learners)).toBeTruthy();
        });
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .get('/api/learners')
        .expectStatus(401);
    });
  });

  describe('GET /api/learners/:id (Find One Learner)', () => {
    it('should return a learner by ID when admin token is provided', async () => {
      await pactum
        .spec()
        .get(`/api/learners/${learnerId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(200)
        .expectJsonLike({
          id: learnerId,
          firstName: expect.any(String),
          lastName: expect.any(String),
          email: expect.any(String),
        });
    });

    it('should return a learner by ID when staff token is provided', async () => {
      await pactum
        .spec()
        .get(`/api/learners/${learnerId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .expectStatus(200);
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .get(`/api/learners/${learnerId}`)
        .expectStatus(401);
    });

    it('should return 404 for non-existent learner ID', async () => {
      await pactum
        .spec()
        .get('/api/learners/999999')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(404);
    });
  });

  describe('PATCH /api/learners/:id (Update Learner)', () => {
    const updateDto: UpdateLearnerDto = {
      firstName: 'Updated',
      lastName: 'Learner',
      course: 'Updated Course',
      schedule: 'Tuesday and Thursday afternoons',
      notes: 'Updated learner notes for E2E testing'
    };

    it('should update a learner when admin token is provided', async () => {
      await pactum
        .spec()
        .patch(`/api/learners/${learnerId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .withBody(updateDto)
        .expectStatus(200)
        .expectJsonLike({
          id: learnerId,
          firstName: updateDto.firstName,
          lastName: updateDto.lastName,
          course: updateDto.course,
          schedule: updateDto.schedule,
          notes: updateDto.notes
        });
    });

    it('should update a learner when staff token is provided', async () => {
      const staffUpdateDto = {
        notes: 'Staff updated these notes'
      };

      await pactum
        .spec()
        .patch(`/api/learners/${learnerId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .withBody(staffUpdateDto)
        .expectStatus(200)
        .expectJsonLike({
          id: learnerId,
          notes: staffUpdateDto.notes
        });
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .patch(`/api/learners/${learnerId}`)
        .withBody(updateDto)
        .expectStatus(401);
    });
  });

  describe('DELETE /api/learners/:id (Remove Learner)', () => {
    it('should return 403 when staff token is provided', async () => {
      await pactum
        .spec()
        .delete(`/api/learners/${learnerId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .expectStatus(403);
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .delete(`/api/learners/${learnerId}`)
        .expectStatus(401);
    });

    it('should delete a learner when admin token is provided', async () => {
      await pactum
        .spec()
        .delete(`/api/learners/${learnerId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(200);

      // Verify learner no longer exists
      await pactum
        .spec()
        .get(`/api/learners/${learnerId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(404);
    });
  });
});
