import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('Auth & Career Twin End-to-End API Integration', () => {
  const testEmail = `testuser_${Date.now()}@resumind.dev`;
  const otherUserEmail = `otheruser_${Date.now()}@resumind.dev`;
  const testPassword = 'SecurePassword123!';

  let accessToken = '';
  let refreshToken = '';
  let userId = '';
  let otherAccessToken = '';
  let createdExperienceId = '';
  let createdSkillId = '';

  afterAll(async () => {
    // Cleanup created test users
    try {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [testEmail, otherUserEmail],
          },
        },
      });
    } catch {
      // Ignore cleanup error if already deleted
    }
  });

  describe('1. Authentication Flow', () => {
    it('POST /api/v1/auth/register - successfully registers a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Integration Test User',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.user.name).toBe('Integration Test User');
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Crucial: no hash exposed!
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
      userId = res.body.data.user.id;
    });

    it('POST /api/v1/auth/register - rejects duplicate email with 409', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Duplicate User',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_TAKEN');
    });

    it('POST /api/v1/auth/login - rejects invalid password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('POST /api/v1/auth/login - successfully logs in with correct password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    it('GET /api/v1/auth/me - returns authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(userId);
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('POST /api/v1/auth/refresh - exchanges refresh token for new tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });
  });

  describe('2. Career Twin CRUD & User Isolation', () => {
    beforeAll(async () => {
      // Create a second user to test user isolation
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: otherUserEmail,
          password: testPassword,
          name: 'Other Isolation User',
        });
      otherAccessToken = res.body.data.accessToken;
    });

    it('GET /api/v1/profile - retrieves or initializes career profile', async () => {
      const res = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toBeDefined();
    });

    it('PUT /api/v1/profile - updates headline, summary, and targetRole', async () => {
      const res = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          headline: 'Full-Stack TypeScript Specialist',
          summary: 'Expert in Node.js, React, and scalable cloud systems.',
          targetRole: 'Senior Staff Engineer',
          targetLevel: 'Staff',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.headline).toBe('Full-Stack TypeScript Specialist');
      expect(res.body.data.profile.targetRole).toBe('Senior Staff Engineer');
    });

    it('POST /api/v1/experiences - creates a new work experience', async () => {
      const res = await request(app)
        .post('/api/v1/experiences')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          company: 'Acme AI Systems',
          title: 'Senior Engineer',
          employmentType: 'Full-time',
          location: 'San Francisco, CA',
          startDate: '2023-01-01T00:00:00.000Z',
          isCurrent: true,
          description: 'Architecting high-scale AI inference endpoints.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.experience.id).toBeDefined();
      expect(res.body.data.experience.company).toBe('Acme AI Systems');

      createdExperienceId = res.body.data.experience.id;
    });

    it('GET /api/v1/experiences - lists user experiences', async () => {
      const res = await request(app)
        .get('/api/v1/experiences')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.experiences.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.experiences.some((e: any) => e.id === createdExperienceId)).toBe(true);
    });

    it('PUT /api/v1/experiences/:id - updates experience', async () => {
      const res = await request(app)
        .put(`/api/v1/experiences/${createdExperienceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Lead Systems Architect',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.experience.title).toBe('Lead Systems Architect');
    });

    it('User Isolation: Other user cannot modify or delete User A experience', async () => {
      // Other user tries to update user A's experience
      const putRes = await request(app)
        .put(`/api/v1/experiences/${createdExperienceId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send({ title: 'Hacked Title' });

      expect(putRes.status).toBe(404);

      // Other user tries to delete user A's experience
      const delRes = await request(app)
        .delete(`/api/v1/experiences/${createdExperienceId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`);

      expect(delRes.status).toBe(404);
    });

    it('POST /api/v1/skills - adds a new skill', async () => {
      const res = await request(app)
        .post('/api/v1/skills')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Distributed Systems',
          category: 'Backend',
          proficiency: 'Expert',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.skill.name).toBe('Distributed Systems');

      createdSkillId = res.body.data.skill.id;
    });

    it('GET /api/v1/skills - lists skills', async () => {
      const res = await request(app)
        .get('/api/v1/skills')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.skills.some((s: any) => s.id === createdSkillId)).toBe(true);
    });

    it('DELETE /api/v1/experiences/:id - deletes experience', async () => {
      const res = await request(app)
        .delete(`/api/v1/experiences/${createdExperienceId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/v1/skills/:id - deletes skill', async () => {
      const res = await request(app)
        .delete(`/api/v1/skills/${createdSkillId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Logout & Token Revocation Flow', () => {
    it('POST /api/v1/auth/logout - revokes refreshToken and rejects subsequent refresh', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Attempting to refresh with revoked token must fail with 401
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
      expect(refreshRes.body.success).toBe(false);
    });
  });
});
