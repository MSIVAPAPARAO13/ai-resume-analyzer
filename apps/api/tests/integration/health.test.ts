import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';

describe('GET /api/v1/health', () => {
  it('should return 200 with status ok and valid health payload', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        status: 'ok',
        version: 'v1',
        environment: expect.any(String),
      },
    });
  });

  it('should return 404 for unknown endpoints with structured error payload', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        code: 'NOT_FOUND',
      },
    });
  });

  it('should include X-Request-Id header in responses', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-request-id']).toBeDefined();
  });
});
