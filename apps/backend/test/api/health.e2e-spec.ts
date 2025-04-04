/**
 * Health API E2E Tests
 * Tests the health check endpoint to ensure the API is running properly
 */
import { INestApplication } from '@nestjs/common';
import * as pactum from 'pactum';
import { initApp } from '../setup';

describe('Health API', () => {
  let app: INestApplication;

  // Setup application before all tests
  beforeAll(async () => {
    app = await initApp();
  });

  // Clean up after all tests
  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/health', () => {
    it('should return 200 OK status', async () => {
      await pactum
        .spec()
        .get('/api/health')
        .expectStatus(200)
        .expectJsonLike({
          status: 'ok',
          message: 'API is up and running'
        })
        .expect((ctx) => {
          const response = ctx.res.json as { status: string; message: string; timestamp: string };
          expect(response).toBeDefined();
          expect(response.timestamp).toBeDefined();
          // Validate timestamp is in ISO format
          expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);
        });
    });
  });
});
