import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { signAccessToken } from '../../src/utils/tokens.js';
import { interviewService } from '../../src/modules/interview/interview.service.js';
import { MockAIProvider } from '../../src/modules/resume/ai/mock-ai.provider.js';
import { calendarService } from '../../src/modules/calendar/calendar.service.js';
import { MockCalendarProvider } from '../../src/modules/calendar/mock-calendar.provider.js';
import { emailService } from '../../src/modules/email/email.service.js';
import { MockEmailProvider } from '../../src/modules/email/mock-email.provider.js';
import { decryptToken } from '../../src/utils/crypto.js';

describe('Phase 7 — Integration Tests: Interview Intelligence & Preparation', () => {
  const user1Email = `phase7_user1_${Date.now()}@resumind.dev`;
  const user2Email = `phase7_user2_${Date.now()}@resumind.dev`;
  const user1Id = '77771111-2222-3333-4444-555555555555';
  const user2Id = '77772222-8888-7777-6666-555555555555';

  let dbAvailable = false;
  let token1 = '';
  let token2 = '';
  let mockEmail: MockEmailProvider;
  let mockCalendar: MockCalendarProvider;
  let sessionId = '';
  let questionId = '';
  let answerId = '';

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

    // Ensure deterministic offline mocks
    mockEmail = new MockEmailProvider();
    mockCalendar = new MockCalendarProvider();
    interviewService.setAIProvider(new MockAIProvider());
    calendarService.setProvider(mockCalendar);
    emailService.setProvider(mockEmail);

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbAvailable = true;

      // Seed test users
      await prisma.user.upsert({
        where: { id: user1Id },
        update: { email: user1Email, name: 'Alice Test' },
        create: { id: user1Id, email: user1Email, name: 'Alice Test' },
      });
      await prisma.user.upsert({
        where: { id: user2Id },
        update: { email: user2Email, name: 'Bob Test' },
        create: { id: user2Id, email: user2Email, name: 'Bob Test' },
      });

      // Seed Career Twin Profile for User 1
      await (prisma as any).careerProfile.upsert({
        where: { userId: user1Id },
        update: { targetRole: 'Senior Full Stack Engineer' },
        create: {
          userId: user1Id,
          targetRole: 'Senior Full Stack Engineer',
          headline: 'Full Stack Engineer with React and Node.js expertise',
        },
      });

      // Seed a verified project in Career Twin
      await (prisma as any).careerProject.create({
        data: {
          profileId: (
            await (prisma as any).careerProfile.findUnique({
              where: { userId: user1Id },
            })
          ).id,
          name: 'TradeFlow',
          description:
            'High-frequency crypto trading engine with WebSocket pipelines',
          technologies: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis'],
        },
      });
    } catch {
      dbAvailable = false;
      console.warn(
        '⚠️ PostgreSQL unavailable; running mock and unit verification for Phase 7.',
      );
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      try {
        await (prisma as any).interviewReminder.deleteMany({
          where: { session: { userId: { in: [user1Id, user2Id] } } },
        });
        await (prisma as any).interviewAnswer.deleteMany({
          where: {
            question: { session: { userId: { in: [user1Id, user2Id] } } },
          },
        });
        await (prisma as any).interviewQuestion.deleteMany({
          where: { session: { userId: { in: [user1Id, user2Id] } } },
        });
        await (prisma as any).interviewSession.deleteMany({
          where: { userId: { in: [user1Id, user2Id] } },
        });
        await (prisma as any).calendarConnection.deleteMany({
          where: { userId: { in: [user1Id, user2Id] } },
        });
        await (prisma as any).careerProject.deleteMany({
          where: { profile: { userId: { in: [user1Id, user2Id] } } },
        });
        await (prisma as any).careerProfile.deleteMany({
          where: { userId: { in: [user1Id, user2Id] } },
        });
        await prisma.user.deleteMany({
          where: { id: { in: [user1Id, user2Id] } },
        });
      } catch {
        // Safe cleanup ignore
      }
    }
  });

  // ============================================================
  // FEATURE A: INTERVIEW SESSION CRUD & USER ISOLATION
  // ============================================================

  describe('Feature A: Interview Session Management', () => {
    it('POST /api/v1/interviews creates a new preparation session', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post('/api/v1/interviews')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Senior Engineer Prep — Stripe',
          mode: 'PREPARATION',
          difficulty: 'MEDIUM',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Senior Engineer Prep — Stripe');
      expect(res.body.data.mode).toBe('PREPARATION');
      expect(res.body.data.difficulty).toBe('MEDIUM');
      expect(res.body.data.status).toBe('DRAFT');

      sessionId = res.body.data.id;
    });

    it('GET /api/v1/interviews lists sessions for authenticated user', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/interviews')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((s: any) => s.id === sessionId)).toBe(true);
    });

    it('Tenant Isolation: User 2 cannot access User 1 interview session', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get(`/api/v1/interviews/${sessionId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('PATCH /api/v1/interviews/:id updates session metadata', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .patch(`/api/v1/interviews/${sessionId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          difficulty: 'HARD',
          notes: 'Focus on high-availability WebSocket scaling',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.difficulty).toBe('HARD');
    });
  });

  // ============================================================
  // FEATURE B & D: QUESTION GENERATION GROUNDED IN EVIDENCE
  // ============================================================

  describe('Feature B & D: Question Generation', () => {
    it('POST /api/v1/interviews/:id/generate-questions generates grounded questions', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post(`/api/v1/interviews/${sessionId}/generate-questions`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          questionCount: 6,
          targetRole: 'Senior Backend Engineer',
          targetCompany: 'Stripe',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.questions).toBeDefined();
      expect(res.body.data.questions.length).toBeGreaterThan(0);

      // Verify question properties
      const q = res.body.data.questions[0];
      expect(q.id).toBeDefined();
      expect(q.category).toBeDefined();
      expect(q.whyAsked).toBeDefined();
      expect(q.expectedSignals).toBeDefined();
      expect(Array.isArray(q.evidenceReferences)).toBe(true);

      // Save questionId for answering test
      questionId = q.id;

      // Verify session moved to IN_PROGRESS
      const sessRes = await request(app)
        .get(`/api/v1/interviews/${sessionId}`)
        .set('Authorization', `Bearer ${token1}`);
      expect(sessRes.body.data.status).toBe('IN_PROGRESS');
    });

    it('GET /api/v1/interviews/:id/questions returns ordered question list', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get(`/api/v1/interviews/${sessionId}/questions`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // FEATURE C & H: ANSWER SUBMISSION & AI EVALUATION
  // ============================================================

  describe('Feature C & H: Answer Submission & Evaluation', () => {
    it('POST /api/v1/interviews/:id/questions/:questionId/answer submits answer draft', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post(`/api/v1/interviews/${sessionId}/questions/${questionId}/answer`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          answerText:
            'In my TradeFlow project, I architected the WebSocket stream with backpressure controls and Redis Pub/Sub channels to distribute events across clustered Node.js workers.',
          isDraft: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.answerText).toContain('TradeFlow');

      answerId = res.body.data.id;
    });

    it('POST /api/v1/interviews/:id/questions/:questionId/evaluate evaluates answer with AI feedback', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post(
          `/api/v1/interviews/${sessionId}/questions/${questionId}/evaluate`,
        )
        .set('Authorization', `Bearer ${token1}`)
        .send({ answerId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.evaluation).toBeDefined();
      expect(res.body.data.evaluation.score).toBeGreaterThanOrEqual(0);
      expect(res.body.data.evaluation.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(res.body.data.evaluation.strengths)).toBe(true);
      expect(
        Array.isArray(res.body.data.evaluation.improvementSuggestions),
      ).toBe(true);
    });

    it('Tenant Isolation: User 2 cannot submit answer to User 1 question', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post(`/api/v1/interviews/${sessionId}/questions/${questionId}/answer`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          answerText: 'Unauthorized answer attempt.',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // FEATURE I & K: PREPARATION PLAN & TECHNICAL CHECKLIST
  // ============================================================

  describe('Feature I & K: Technical Preparation Plan', () => {
    it('GET /api/v1/interviews/:id/prep-plan returns structured 5-day plan & technical checklist', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get(`/api/v1/interviews/${sessionId}/prep-plan`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dailyPlans).toBeDefined();
      expect(res.body.data.dailyPlans.length).toBe(5);
      expect(Array.isArray(res.body.data.technicalChecklist)).toBe(true);
    });
  });

  // ============================================================
  // FEATURE J: SESSION COMPLETION & FINAL REPORT
  // ============================================================

  describe('Feature J: Session Completion & Final Readiness Report', () => {
    it('POST /api/v1/interviews/:id/complete finalizes interview and triggers email', async () => {
      if (!dbAvailable) return;

      mockEmail.clear();

      const res = await request(app)
        .post(`/api/v1/interviews/${sessionId}/complete`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.overallScore).toBeDefined();

      // Verify completion email sent
      expect(mockEmail.sentEmails.length).toBe(1);
      expect(mockEmail.sentEmails[0].to).toBe(user1Email);
      expect(mockEmail.sentEmails[0].subject).toContain('Preparation Complete');
    });

    it('GET /api/v1/interviews/:id/report returns final readiness score & category breakdown', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get(`/api/v1/interviews/${sessionId}/report`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.report).toBeDefined();
      expect(res.body.data.report.overallPreparationScore).toBeDefined();
      expect(res.body.data.report.technicalReadiness).toBeDefined();
      expect(res.body.data.report.behavioralReadiness).toBeDefined();
      expect(res.body.data.report.resumeReadiness).toBeDefined();
      expect(res.body.data.report.summaryFeedback).toBeDefined();
    });
  });

  // ============================================================
  // FEATURE L: GOOGLE CALENDAR OAUTH & SCHEDULING
  // ============================================================

  describe('Feature L: Calendar Integration & Scheduling', () => {
    it('GET /api/v1/calendar/connect generates signed OAuth URL', async () => {
      const res = await request(app)
        .get('/api/v1/calendar/connect')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toMatch(/accounts\.google\.com|calendar\/callback/);
      expect(res.body.data.url).toContain('state=');
    });

    it('GET /api/v1/calendar/status returns connection state', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/calendar/status')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.connected).toBe('boolean');
    });

    it('OAuth Callback validates signed state and stores encrypted token', async () => {
      if (!dbAvailable) return;

      const validState = calendarService.generateState(user1Id);
      const res = await request(app).get('/api/v1/calendar/callback').query({
        code: 'mock_valid_auth_code_12345',
        state: validState,
      });

      // Redirects to frontend with success
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('status=success');

      // Verify token is encrypted in database
      const conn = await prisma.calendarConnection.findUnique({
        where: { userId: user1Id },
      });
      expect(conn).toBeDefined();
      expect(conn?.accessTokenEncrypted).not.toBe('mock_gcal_access_token_mock_val');
      // Verify token can be decrypted cleanly
      const decrypted = decryptToken(conn!.accessTokenEncrypted);
      expect(decrypted).toContain('mock_gcal_access_token');
    });

    it('OAuth Callback rejects tampered state', async () => {
      const res = await request(app).get('/api/v1/calendar/callback').query({
        code: 'mock_code',
        state: 'tampered-invalid-state-payload',
      });

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('status=error');
    });

    it('POST /api/v1/interviews/:id/calendar-event schedules event via CalendarProvider', async () => {
      if (!dbAvailable) return;

      const startTime = new Date(
        Date.now() + 48 * 60 * 60 * 1000,
      ).toISOString();
      const endTime = new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post(`/api/v1/interviews/${sessionId}/calendar-event`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          summary: 'Interview Preparation — Stripe',
          startTime,
          endTime,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.event).toBeDefined();
      expect(res.body.data.event.id).toBeDefined();

      // Verify a reminder record is saved
      const reminders = await (prisma as any).interviewReminder.findMany({
        where: { sessionId },
      });
      expect(reminders.length).toBeGreaterThan(0);
    });

    it('POST /api/v1/calendar/disconnect disconnects and cleans up connection', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post('/api/v1/calendar/disconnect')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const statusRes = await request(app)
        .get('/api/v1/calendar/status')
        .set('Authorization', `Bearer ${token1}`);
      expect(statusRes.body.data.connected).toBe(false);
    });
  });

  // ============================================================
  // SECURITY & PURGING
  // ============================================================

  describe('Security & Secrets Protection', () => {
    it('Never leaks API keys or encryption secrets in response headers or body', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get(`/api/v1/interviews/${sessionId}`)
        .set('Authorization', `Bearer ${token1}`);

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('GEMINI_API_KEY');
      expect(bodyStr).not.toContain('RESEND_API_KEY');
      expect(bodyStr).not.toContain('GOOGLE_CLIENT_SECRET');
      expect(bodyStr).not.toContain('resumind-secret-key');
    });

    it('DELETE /api/v1/interviews/:id deletes session with cascade safety', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .delete(`/api/v1/interviews/${sessionId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const getRes = await request(app)
        .get(`/api/v1/interviews/${sessionId}`)
        .set('Authorization', `Bearer ${token1}`);
      expect(getRes.status).toBe(404);
    });
  });
});
