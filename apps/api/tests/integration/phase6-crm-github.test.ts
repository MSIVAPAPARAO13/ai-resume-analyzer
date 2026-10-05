import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { signAccessToken } from '../../src/utils/tokens.js';
import { gitHubService } from '../../src/modules/github/github.service.js';
import { MockGitHubProvider } from '../../src/modules/github/mock-github.provider.js';
import { encryptToken, decryptToken } from '../../src/utils/crypto.js';
import { sanitizeMarkdown } from '../../src/modules/github/tech-extractor.js';
import { evidenceGuardService } from '../../src/modules/resume/tailoring/evidence-guard.service.js';

describe('Phase 6 — Integration Tests: Application CRM & GitHub Career Evidence', () => {
  const user1Email = `phase6_user1_${Date.now()}@resumind.dev`;
  const user2Email = `phase6_user2_${Date.now()}@resumind.dev`;
  const user1Id = '11111111-2222-3333-4444-555555555555';
  const user2Id = '99999999-8888-7777-6666-555555555555';

  let dbAvailable = false;
  let token1 = '';
  let token2 = '';
  let applicationId = '';

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

    // Ensure mock provider is used for deterministic offline tests
    gitHubService.setProvider(new MockGitHubProvider());

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbAvailable = true;

      // Seed test users
      await prisma.user.upsert({
        where: { id: user1Id },
        update: { email: user1Email },
        create: { id: user1Id, email: user1Email },
      });
      await prisma.user.upsert({
        where: { id: user2Id },
        update: { email: user2Email },
        create: { id: user2Id, email: user2Email },
      });
    } catch {
      dbAvailable = false;
      console.warn(
        '⚠️ PostgreSQL unavailable; running mock and unit verification.',
      );
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      try {
        await prisma.application.deleteMany({
          where: { userId: { in: [user1Id, user2Id] } },
        });
        await prisma.gitHubRepository.deleteMany({
          where: { userId: { in: [user1Id, user2Id] } },
        });
        await prisma.gitHubConnection.deleteMany({
          where: { userId: { in: [user1Id, user2Id] } },
        });
        await prisma.user.deleteMany({
          where: { id: { in: [user1Id, user2Id] } },
        });
      } catch {
        // ignore cleanup error
      }
    }
  });

  // ============================================================================
  // PART A — APPLICATION CRM TESTS
  // ============================================================================
  describe('Application CRM Lifecycle & Events', () => {
    it('requires authentication for applications API', async () => {
      const res = await request(app).get('/api/v1/applications');
      expect(res.status).toBe(401);
    });

    it('validates input when creating an application (rejects empty company/role)', async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          company: '',
          role: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('creates an application and automatically generates initial CREATED event', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          company: 'Stripe',
          role: 'Staff Infrastructure Engineer',
          jobUrl: 'https://stripe.com/jobs/staff-infra',
          status: 'APPLIED',
          appliedAt: new Date().toISOString(),
          followUpAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          recruiterName: 'Alex Smith',
          recruiterEmail: 'alex.smith@stripe.com',
          notes: 'Referral through Jane Doe. Completed screening form.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.company).toBe('Stripe');
      expect(res.body.data.role).toBe('Staff Infrastructure Engineer');
      expect(res.body.data.status).toBe('APPLIED');
      expect(res.body.data.events.length).toBeGreaterThanOrEqual(1);

      applicationId = res.body.data.id;
    });

    it('lists applications belonging to the authenticated user', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((a: any) => a.id === applicationId)).toBe(true);
    });

    it('filters applications by status and search', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/applications?status=APPLIED&search=Stripe')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].company).toBe('Stripe');
    });

    it('gets a single application by ID with timeline events', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get(`/api/v1/applications/${applicationId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(applicationId);
      expect(res.body.data.company).toBe('Stripe');
      expect(res.body.data.events).toBeDefined();
    });

    it('updates application details (recruiter, notes, follow-up date)', async () => {
      if (!dbAvailable) return;

      const newDate = new Date(
        Date.now() + 14 * 24 * 3600 * 1000,
      ).toISOString();
      const res = await request(app)
        .put(`/api/v1/applications/${applicationId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          notes:
            'Updated: Recruiter confirmed technical phone screen scheduled.',
          followUpAt: newDate,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toContain('technical phone screen');
      expect(new Date(res.body.data.followUpAt).toISOString()).toBe(newDate);
    });

    it('updates status and automatically logs transition event', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .patch(`/api/v1/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          status: 'INTERVIEW',
          notes: 'Invited to Round 1 System Architecture Interview',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('INTERVIEW');

      // Verify event was recorded
      const eventsRes = await request(app)
        .get(`/api/v1/applications/${applicationId}/events`)
        .set('Authorization', `Bearer ${token1}`);

      expect(eventsRes.status).toBe(200);
      expect(
        eventsRes.body.data.some(
          (e: any) =>
            e.type === 'INTERVIEW' &&
            e.description.includes('Round 1 System Architecture'),
        ),
      ).toBe(true);
    });

    it('adds a manual timeline event to the application', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post(`/api/v1/applications/${applicationId}/events`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'NOTE',
          description: 'Followed up via email regarding next steps with Alex.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('NOTE');
      expect(res.body.data.description).toContain('Followed up via email');
    });

    it('computes CRM analytics (total applications, interview rate, offer rate)', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/applications/analytics')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalApplications).toBeGreaterThanOrEqual(1);
      expect(res.body.data.statusCounts).toBeDefined();
      expect(res.body.data.applicationToInterviewRate).toBeGreaterThanOrEqual(
        0,
      );
      expect(typeof res.body.data.offerRate).toBe('number');
      expect(Array.isArray(res.body.data.resumeVersionUsage)).toBe(true);
    });

    it('enforces strict cross-user isolation (User 2 cannot access User 1 application)', async () => {
      if (!dbAvailable) return;

      // User 2 GET application
      const getRes = await request(app)
        .get(`/api/v1/applications/${applicationId}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(getRes.status).toBe(404);

      // User 2 update status
      const patchRes = await request(app)
        .patch(`/api/v1/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ status: 'OFFER' });
      expect(patchRes.status).toBe(404);

      // User 2 delete
      const delRes = await request(app)
        .delete(`/api/v1/applications/${applicationId}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(delRes.status).toBe(404);
    });
  });

  // ============================================================================
  // PART B — GITHUB CAREER EVIDENCE TESTS
  // ============================================================================
  describe('GitHub Career Evidence Architecture & Security', () => {
    it('verifies AES-256-GCM token encryption and decryption', () => {
      const plainSecretToken = 'gho_secret_token_1234567890abcdefg';
      const encrypted = encryptToken(plainSecretToken);

      expect(encrypted).not.toBe(plainSecretToken);
      expect(encrypted).toContain(':'); // iv:authTag:cipher format

      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(plainSecretToken);
    });

    it('validates secure OAuth state generation and HMAC tampering detection', () => {
      const state = gitHubService.generateState(user1Id);
      expect(state).toContain('.');

      // Valid state succeeds
      const { userId } = gitHubService.validateState(state);
      expect(userId).toBe(user1Id);

      // Tampered state fails
      const tampered = state.slice(0, -3) + 'abc';
      expect(() => gitHubService.validateState(tampered)).toThrow();
    });

    it('GET /api/v1/github/connect returns authorization URL with signed state', async () => {
      const res = await request(app)
        .get('/api/v1/github/connect')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.url).toBeDefined();
      expect(res.body.data.state).toBeDefined();
    });

    it('GET /api/v1/github/callback completes OAuth flow and saves encrypted connection', async () => {
      if (!dbAvailable) return;

      const state = gitHubService.generateState(user1Id);
      const res = await request(app)
        .get(
          `/api/v1/github/callback?code=mock_code&state=${encodeURIComponent(state)}`,
        )
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.connected).toBe(true);
      expect(res.body.data.username).toBe('octocat-engineer');

      // CRITICAL SECURITY: Verify database never stores tokens in plaintext
      const conn = await prisma.gitHubConnection.findUnique({
        where: { userId: user1Id },
      });
      expect(conn).toBeDefined();
      expect(conn?.accessTokenEncrypted).not.toBe(
        'gho_mock_access_token_secure_987654321',
      );
      expect(conn?.accessTokenEncrypted).toContain(':');
    });

    it('GET /api/v1/github/me returns connection status without secret leakage', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/github/me')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.connected).toBe(true);
      expect(res.body.data.username).toBe('octocat-engineer');
      // Verify secrets never exposed
      expect(res.body.data.accessToken).toBeUndefined();
      expect(res.body.data.accessTokenEncrypted).toBeUndefined();
    });

    it('GET /api/v1/github/repositories lists synced repositories', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/github/repositories')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data.some((r: any) => r.name === 'tradeflow')).toBe(true);
    });

    it('GET /api/v1/github/repositories/:id/languages extracts normalized languages', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/github/repositories/tradeflow/languages')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.TypeScript).toBeDefined();
    });

    it('GET /api/v1/github/repositories/:id/readme extracts technologies with XSS sanitization', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/github/repositories/tradeflow/readme')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.readme).toContain('TradeFlow');
      expect(Array.isArray(res.body.data.detectedTechnologies)).toBe(true);
      expect(res.body.data.detectedTechnologies).toContain('TypeScript');
      expect(res.body.data.detectedTechnologies).toContain('Redis');
    });

    it('sanitizes malicious README markdown preventing XSS injection', () => {
      const maliciousMarkdown = `
        # My Cool Project
        <script>alert("XSS")</script>
        <img src="x" onerror="stealCookies()" />
        <iframe src="javascript:evil()"></iframe>
        [Click Me](javascript:stealData())
      `;
      const clean = sanitizeMarkdown(maliciousMarkdown);

      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('onerror=');
      expect(clean).not.toContain('<iframe');
      expect(clean).not.toContain('javascript:');
    });

    it('POST /api/v1/github/repositories/:id/import imports repository into Career Twin', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post('/api/v1/github/repositories/tradeflow/import')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'TradeFlow Matching Engine',
          description:
            'High throughput matching engine with Redis & TypeScript.',
          technologies: ['TypeScript', 'Redis', 'Node.js', 'Express'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.name).toBe('TradeFlow Matching Engine');
      expect(res.body.data.status).toBe('VERIFIED_USER_DATA');

      // Verify Project exists in database
      const profile = await prisma.careerProfile.findUnique({
        where: { userId: user1Id },
        include: { projects: true },
      });
      expect(
        profile?.projects.some((p) => p.name === 'TradeFlow Matching Engine'),
      ).toBe(true);
    });

    it('integrates with Evidence Guard distinguishing GitHub evidence from Career Twin', () => {
      const careerTwin = {
        skills: [{ name: 'JavaScript' }],
        projects: [],
      };
      const parsedResume = {
        skills: [{ name: 'JavaScript' }],
      } as any;
      const githubEvidence = [
        {
          name: 'cloud-metrics-agent',
          language: 'Go',
          topics: ['kubernetes'],
          detectedTechnologies: ['Go', 'Docker', 'Kubernetes'],
        },
      ];

      // AI suggested adding Kubernetes
      const suggestions = [
        {
          id: 'sug-1',
          type: 'REWRITE',
          section: 'EXPERIENCE',
          original: 'Worked on backend deployment and testing.',
          proposed:
            'Architected container orchestration using Kubernetes and Docker.',
          reason: 'Job requires Kubernetes experience.',
          evidenceReferences: [],
          confidence: 0.9,
          requiresUserApproval: true,
        },
      ];

      const guarded = evidenceGuardService.evaluateSuggestions(
        suggestions as any,
        careerTwin,
        parsedResume,
        undefined,
        githubEvidence,
      );

      expect(guarded.suggestions[0].guardStatus).toBe('UNSUPPORTED');
      expect(guarded.suggestions[0].guardExplanation).toContain(
        'External GitHub evidence detected (KUBERNETES, DOCKER)',
      );
      expect(guarded.suggestions[0].externalGitHubEvidence).toContain(
        'KUBERNETES',
      );
    });

    it('POST /api/v1/github/disconnect removes user connection and cached repositories', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post('/api/v1/github/disconnect')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);

      const statusRes = await request(app)
        .get('/api/v1/github/me')
        .set('Authorization', `Bearer ${token1}`);
      expect(statusRes.body.data.connected).toBe(false);
    });
  });
});
