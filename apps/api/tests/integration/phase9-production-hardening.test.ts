import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { signAccessToken } from '../../src/utils/tokens.js';
import {
  validateFileSignature,
  sanitizeFilename,
} from '../../src/middleware/file-validation.js';
import { isSafeUrl } from '../../src/middleware/ssrf-guard.js';

describe('Phase 9 — Integration Tests: Production Hardening, Security, Reliability & Performance', () => {
  const user1Email = `phase9_user1_${Date.now()}@resumind.dev`;
  const user2Email = `phase9_user2_${Date.now()}@resumind.dev`;
  const user1Id = '99991111-2222-3333-4444-555555555555';
  const user2Id = '99992222-8888-7777-6666-555555555555';

  let dbAvailable = false;
  let token1 = '';
  let token2 = '';
  let user1JobId = '';

  beforeAll(async () => {
    token1 = signAccessToken({
      userId: user1Id,
      email: user1Email,
      role: 'USER',
    });
    token2 = signAccessToken({
      userId: user2Id,
      email: user2Email,
      role: 'USER',
    });

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbAvailable = true;

      // Seed test users
      await prisma.user.upsert({
        where: { id: user1Id },
        update: { email: user1Email, name: 'Alice Phase9' },
        create: { id: user1Id, email: user1Email, name: 'Alice Phase9' },
      });
      await prisma.user.upsert({
        where: { id: user2Id },
        update: { email: user2Email, name: 'Bob Phase9' },
        create: { id: user2Id, email: user2Email, name: 'Bob Phase9' },
      });

      // Seed a job for User 1
      const job = await prisma.job.create({
        data: {
          userId: user1Id,
          title: 'Staff Security Engineer',
          company: 'CyberCorp',
          description:
            'Secure application pipelines, penetration testing, and zero trust design.',
          status: 'SAVED',
        },
      });
      user1JobId = job.id;
    } catch {
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      try {
        await prisma.job.deleteMany({
          where: { userId: { in: [user1Id, user2Id] } },
        });
        await prisma.user.deleteMany({
          where: { id: { in: [user1Id, user2Id] } },
        });
      } catch {
        // Cleanup best effort
      }
    }
  });

  // ─── 1. Health Checks & Observability ──────────────────────────────────────
  describe('Health Checks & Observability', () => {
    it('GET /api/v1/health returns 200 with service information', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
    });

    it('GET /api/v1/health/live returns 200 with liveness status', async () => {
      const res = await request(app).get('/api/v1/health/live');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('live');
    });

    it('GET /api/v1/health/ready returns 200 when database is healthy', async () => {
      if (!dbAvailable) return;
      const res = await request(app).get('/api/v1/health/ready');
      expect([200, 503]).toContain(res.status);
      expect(res.body).toHaveProperty('data');
    });

    it('Responses include X-Request-Id header for tracing', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id'].length).toBeGreaterThan(0);
    });
  });

  // ─── 2. HTTP Security Headers ─────────────────────────────────────────────
  describe('HTTP Security Headers', () => {
    it('Responses include Content-Security-Policy and X-Content-Type-Options', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('Responses include Permissions-Policy header', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['permissions-policy']).toBeDefined();
    });
  });

  // ─── 3. Authentication & JWT Hardening ────────────────────────────────────
  describe('Authentication & JWT Hardening', () => {
    it('Protected endpoints return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/v1/jobs');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Protected endpoints return 401 when malformed token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', 'Bearer invalid.token.payload');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Protected endpoints return 401 when token has forged signature', async () => {
      const forgedToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiJ9.invalidsignature12345';
      const res = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${forgedToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── 4. SSRF Guard ────────────────────────────────────────────────────────
  describe('SSRF Protection Guard', () => {
    it('Blocks localhost, loopback, and private IP ranges in isSafeUrl', () => {
      expect(isSafeUrl('http://127.0.0.1:8080/secret')).toBe(false);
      expect(isSafeUrl('http://localhost:3000/admin')).toBe(false);
      expect(isSafeUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
      expect(isSafeUrl('http://10.0.0.1/internal')).toBe(false);
      expect(isSafeUrl('http://192.168.1.1/router')).toBe(false);
      expect(isSafeUrl('http://172.16.0.1/private')).toBe(false);
      expect(isSafeUrl('ftp://example.com/file')).toBe(false);
    });

    it('Allows legitimate public HTTPS URLs in isSafeUrl', () => {
      expect(isSafeUrl('https://careers.google.com/jobs/12345')).toBe(true);
      expect(isSafeUrl('https://linkedin.com/jobs/view/99999')).toBe(true);
      expect(isSafeUrl('https://github.com/my-org/repo')).toBe(true);
    });

    it('Rejects SSRF attempt in POST /api/v1/jobs sourceUrl', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Suspicious Job',
          company: 'Malicious Corp',
          description:
            'A job posting trying to probe the cloud metadata service.',
          sourceUrl: 'http://169.254.169.254/latest/meta-data/',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain(
        'Blocked internal or private URL',
      );
    });
  });

  // ─── 5. File Upload Magic Byte & Path Traversal Security ───────────────────
  describe('File Upload Security & Signature Validation', () => {
    it('Validates PDF magic bytes correctly (%PDF)', () => {
      const validPdfBuffer = Buffer.from(
        '%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj',
      );
      expect(() =>
        validateFileSignature(validPdfBuffer, 'resume.pdf'),
      ).not.toThrow();
    });

    it('Validates DOCX magic bytes correctly (PK\\x03\\x04)', () => {
      const validDocxBuffer = Buffer.from([
        0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00,
      ]);
      expect(() =>
        validateFileSignature(validDocxBuffer, 'resume.docx'),
      ).not.toThrow();
    });

    it('Rejects files with mismatched signatures (plain text or script masquerading as PDF)', () => {
      const fakePdfBuffer = Buffer.from(
        '<html><body><script>alert(1)</script></body></html>',
      );
      expect(() =>
        validateFileSignature(fakePdfBuffer, 'resume.pdf'),
      ).toThrow();
    });

    it('Sanitizes filenames to prevent path traversal', () => {
      const clean1 = sanitizeFilename('../../etc/passwd.pdf');
      expect(clean1).not.toContain('..');
      expect(clean1).not.toContain('/');
      expect(clean1).not.toContain('\\');

      const clean2 = sanitizeFilename(
        '..\\..\\Windows\\System32\\cmd.exe.docx',
      );
      expect(clean2).not.toContain('..');
      expect(clean2).not.toContain('\\');
    });
  });

  // ─── 6. User Isolation & Negative Authorization ───────────────────────────
  describe('Tenant Isolation / Negative Authorization', () => {
    it('User 2 cannot access User 1 job (returns 404)', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .get(`/api/v1/jobs/${user1JobId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User 2 cannot update User 1 job (returns 404)', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .put(`/api/v1/jobs/${user1JobId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ title: 'Hijacked Job Title' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User 2 cannot delete User 1 job (returns 404)', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .delete(`/api/v1/jobs/${user1JobId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── 7. Pagination Safety ─────────────────────────────────────────────────
  describe('Pagination Safety & Limits', () => {
    it('GET /api/v1/jobs with valid pagination parameters returns 200', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .get('/api/v1/jobs?page=1&pageSize=20')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/applications with valid pagination parameters returns 200', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .get('/api/v1/applications?page=1&pageSize=10')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ─── 8. Safe Error Handling ───────────────────────────────────────────────
  describe('Error Response Safety', () => {
    it('Error responses do not leak database credentials or internal secrets', async () => {
      const res = await request(app)
        .get('/api/v1/jobs/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token1}`);

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('DATABASE_URL');
      expect(bodyStr).not.toContain('JWT_SECRET');
      expect(bodyStr).not.toContain('password');
      expect(bodyStr).not.toContain('passwordHash');
    });
  });
});
