import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';

// ─── Auth Integration Tests ───────────────────────────────────────────────────
// These tests use the in-memory Express app only (no live DB required).
// They verify: validation, 404 shape, and endpoint reachability.
// Full DB-dependent tests (register, login, me) require a live PostgreSQL instance.

describe('GET /api/v1/health', () => {
  it('should return 200 with status ok and valid health payload', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.version).toBe('v1');
    expect(res.body.data.services).toBeDefined();
  }, 30000); // 30s timeout — health probes wait for DB/Redis connection attempts

  it('should return 404 for unknown endpoints with structured error payload', async () => {
    const res = await request(app).get('/api/v2/completely-unknown-route');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
  });

  it('should include X-Request-Id header in responses', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-request-id']).toBeDefined();
  });
});

describe('POST /api/v1/auth/register - validation', () => {
  it('should reject request with missing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ password: 'Password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject request with invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'Password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject request with password under 8 chars', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'valid@test.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/login - validation', () => {
  it('should reject request with missing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'Password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject request with empty password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/auth/me - authentication guard', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(['UNAUTHORIZED', 'INVALID_TOKEN']).toContain(res.body.error.code);
  });

  it('should return 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer this.is.fake');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/refresh - validation', () => {
  it('should reject missing refreshToken', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/logout - validation', () => {
  it('should reject missing refreshToken', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Career routes - authentication guard', () => {
  const careerRoutes = [
    { method: 'get', path: '/api/v1/profile' },
    { method: 'get', path: '/api/v1/experiences' },
    { method: 'get', path: '/api/v1/education' },
    { method: 'get', path: '/api/v1/projects' },
    { method: 'get', path: '/api/v1/skills' },
    { method: 'get', path: '/api/v1/certifications' },
    { method: 'get', path: '/api/v1/achievements' },
  ];

  careerRoutes.forEach(({ method, path }) => {
    it(`${method.toUpperCase()} ${path} should return 401 without token`, async () => {
      const res = await (request(app) as any)[method](path);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
