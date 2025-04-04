/**
 * Appointment API E2E Tests
 * Tests for the /api/appointments endpoints
 */
import { INestApplication } from '@nestjs/common';
import * as pactum from 'pactum';
import { initApp } from '../setup';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { CreateAppointmentDto, AppointmentType } from '../../src/modules/appointment/dto/create-appointment.dto';
import { AppointmentStatus } from '@prisma/client';
import { UpdateAppointmentDto } from '../../src/modules/appointment/dto/update-appointment.dto';

// User role enum to match the one in the controller
enum UserRole {
  ADMIN = 'ADMIN',
  THERAPIST = 'THERAPIST',
  STAFF = 'STAFF'
}

describe('Appointment API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let staffToken: string;
  let therapistToken: string;
  let appointmentId: string;
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

    // Create a test client to use for appointments
    const clientResponse = await pactum
      .spec()
      .post('/api/clients')
      .withHeaders({
        Authorization: `Bearer ${adminToken}`
      })
      .withBody({
        firstName: 'Appointment',
        lastName: 'TestClient',
        email: `appointment-client-${Date.now()}@example.com`,
        phone: '555-987-6543',
        address: '456 Appointment St',
        city: 'Testville',
        state: 'TS',
        zipCode: '12345',
        dateOfBirth: new Date('1990-01-01').toISOString()
      })
      .expectStatus(201);

    clientId = clientResponse.body.id;
  });

  // Clean up after all tests
  afterAll(async () => {
    // Try to clean up the test client
    try {
      await pactum
        .spec()
        .delete(`/api/clients/${clientId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        });
    } catch (error) {
      console.error('Failed to clean up test client:', error);
    }

    await app.close();
  });

  describe('POST /api/appointments (Create Appointment)', () => {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1); // Tomorrow
    startTime.setHours(10, 0, 0, 0); // 10:00 AM

    const endTime = new Date(startTime);
    endTime.setHours(11, 0, 0, 0); // 11:00 AM

    const dto: CreateAppointmentDto = {
      clientId,
      therapistId: '1', // Using admin ID as therapist for testing
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      type: AppointmentType.CONSULTATION,
      status: AppointmentStatus.SCHEDULED,
      title: 'Initial Consultation',
      notes: 'Test appointment created for E2E testing'
    };

    it('should create a new appointment when admin token is provided', async () => {
      const response = await pactum
        .spec()
        .post('/api/appointments')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .withBody(dto)
        .expectStatus(201);

      // Store appointment ID for later tests
      appointmentId = response.body.id;
      
      // Expect response to have required appointment fields
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('clientId', clientId);
      expect(response.body).toHaveProperty('startTime');
      expect(response.body).toHaveProperty('endTime');
      expect(response.body).toHaveProperty('type', dto.type);
      expect(response.body).toHaveProperty('status', dto.status);
    });

    it('should create a new appointment when staff token is provided', async () => {
      const staffDto = {
        ...dto,
        startTime: new Date(startTime.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        endTime: new Date(endTime.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Staff created appointment for E2E testing'
      };

      await pactum
        .spec()
        .post('/api/appointments')
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .withBody(staffDto)
        .expectStatus(201)
        .expectJsonLike({
          clientId: staffDto.clientId,
          type: staffDto.type,
          status: staffDto.status
        });
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .post('/api/appointments')
        .withBody(dto)
        .expectStatus(401);
    });

    it('should return 400 for invalid data', async () => {
      await pactum
        .spec()
        .post('/api/appointments')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .withBody({
          // Missing required fields
          clientId
        })
        .expectStatus(400);
    });
  });

  describe('GET /api/appointments (Find All Appointments)', () => {
    it('should return list of appointments when admin token is provided', async () => {
      await pactum
        .spec()
        .get('/api/appointments')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(200)
        .expectJsonLike([
          {
            id: expect.any(String),
            clientId: expect.any(String),
            startTime: expect.any(String),
            endTime: expect.any(String),
            appointmentType: expect.any(String),
            status: expect.any(String)
          }
        ])
        .expect((ctx) => {
          const appointments = ctx.res.json as any[];
          expect(Array.isArray(appointments)).toBeTruthy();
          expect(appointments.length).toBeGreaterThan(0);
        });
    });

    it('should return list of appointments when staff token is provided', async () => {
      await pactum
        .spec()
        .get('/api/appointments')
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .expectStatus(200)
        .expect((ctx) => {
          const appointments = ctx.res.json as any[];
          expect(Array.isArray(appointments)).toBeTruthy();
        });
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .get('/api/appointments')
        .expectStatus(401);
    });
  });

  describe('GET /api/appointments/:id (Find One Appointment)', () => {
    it('should return an appointment by ID when admin token is provided', async () => {
      await pactum
        .spec()
        .get(`/api/appointments/${appointmentId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(200)
        .expectJsonLike({
          id: appointmentId,
          clientId: clientId,
          appointmentType: expect.any(String),
          status: expect.any(String)
        });
    });

    it('should return an appointment by ID when staff token is provided', async () => {
      await pactum
        .spec()
        .get(`/api/appointments/${appointmentId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .expectStatus(200);
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .get(`/api/appointments/${appointmentId}`)
        .expectStatus(401);
    });

    it('should return 404 for non-existent appointment ID', async () => {
      await pactum
        .spec()
        .get('/api/appointments/999999')
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(404);
    });
  });

  describe('PATCH /api/appointments/:id (Update Appointment)', () => {
    const updateDto: UpdateAppointmentDto = {
      status: AppointmentStatus.COMPLETED,
      notes: 'Updated appointment notes for E2E testing'
    };

    it('should update an appointment when admin token is provided', async () => {
      await pactum
        .spec()
        .patch(`/api/appointments/${appointmentId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .withBody(updateDto)
        .expectStatus(200)
        .expectJsonLike({
          id: appointmentId,
          status: updateDto.status,
          notes: updateDto.notes
        });
    });

    it('should update an appointment when staff token is provided', async () => {
      const staffUpdateDto = {
        status: 'RESCHEDULED',
        notes: 'Staff updated these notes'
      };

      await pactum
        .spec()
        .patch(`/api/appointments/${appointmentId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .withBody(staffUpdateDto)
        .expectStatus(200)
        .expectJsonLike({
          id: appointmentId,
          status: staffUpdateDto.status,
          notes: staffUpdateDto.notes
        });
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .patch(`/api/appointments/${appointmentId}`)
        .withBody(updateDto)
        .expectStatus(401);
    });
  });

  describe('DELETE /api/appointments/:id (Remove Appointment)', () => {
    it('should return 403 when staff token is provided', async () => {
      await pactum
        .spec()
        .delete(`/api/appointments/${appointmentId}`)
        .withHeaders({
          Authorization: `Bearer ${staffToken}`
        })
        .expectStatus(403);
    });

    it('should return 401 when no token is provided', async () => {
      await pactum
        .spec()
        .delete(`/api/appointments/${appointmentId}`)
        .expectStatus(401);
    });

    it('should delete an appointment when admin token is provided', async () => {
      await pactum
        .spec()
        .delete(`/api/appointments/${appointmentId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(200);

      // Verify appointment no longer exists
      await pactum
        .spec()
        .get(`/api/appointments/${appointmentId}`)
        .withHeaders({
          Authorization: `Bearer ${adminToken}`
        })
        .expectStatus(404);
    });
  });
});
