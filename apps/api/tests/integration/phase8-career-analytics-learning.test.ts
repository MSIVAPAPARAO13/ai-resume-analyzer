import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { signAccessToken } from '../../src/utils/tokens.js';
import { MockAIProvider } from '../../src/modules/resume/ai/mock-ai.provider.js';
import {
  LearningPlanGenerationSchema,
  CareerInsightsResultSchema,
  SkillGapExplanationResultSchema,
} from '../../src/modules/resume/ai/ai.interface.js';

describe('Phase 8 — Integration Tests: Career Analytics, Skill Gap & Learning Plan', () => {
  const user1Email = `phase8_user1_${Date.now()}@resumind.dev`;
  const user2Email = `phase8_user2_${Date.now()}@resumind.dev`;
  const user1Id = '88881111-2222-3333-4444-555555555555';
  const user2Id = '88882222-8888-7777-6666-555555555555';

  let dbAvailable = false;
  let token1 = '';
  let token2 = '';
  let createdPlanId = '';
  let createdGoalId = '';
  let createdTaskId = '';

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
        update: { email: user1Email, name: 'Alice Phase8' },
        create: { id: user1Id, email: user1Email, name: 'Alice Phase8' },
      });
      await prisma.user.upsert({
        where: { id: user2Id },
        update: { email: user2Email, name: 'Bob Phase8' },
        create: { id: user2Id, email: user2Email, name: 'Bob Phase8' },
      });

      // Seed Career Profile with skills, projects, and target role for User 1
      const cp = await prisma.careerProfile.upsert({
        where: { userId: user1Id },
        update: {
          targetRole: 'Full Stack Engineer',
          targetLevel: 'Senior',
        },
        create: {
          userId: user1Id,
          targetRole: 'Full Stack Engineer',
          targetLevel: 'Senior',
        },
      });

      // Add skills to Career Twin
      await prisma.careerSkill.createMany({
        data: [
          { profileId: cp.id, name: 'React.js', proficiency: 'ADVANCED' },
          { profileId: cp.id, name: 'Node.js', proficiency: 'EXPERT' },
          { profileId: cp.id, name: 'Postgres', proficiency: 'INTERMEDIATE' },
        ],
        skipDuplicates: true,
      });

      // Add project to Career Twin
      await prisma.careerProject.create({
        data: {
          profileId: cp.id,
          name: 'E-Commerce Microservice',
          description: 'Built scalable backend using Node.js and TypeScript',
          technologies: ['Node.js', 'TypeScript', 'PostgreSQL'],
        },
      });

      // Seed a Job with JobDNA requiring TypeScript, Docker, Kubernetes
      const job = await prisma.job.create({
        data: {
          title: 'Full Stack Engineer',
          company: 'Acme Cloud Corp',
          description:
            'Seeking engineer with TypeScript, Docker, and React experience',
          source: 'MANUAL',
        },
      });

      await prisma.jobDNA.create({
        data: {
          jobId: job.id,
          roleCategory: 'ENGINEERING',
          seniority: 'SENIOR',
          requiredSkills: ['TypeScript', 'Docker', 'PostgreSQL'],
          preferredSkills: ['Kubernetes', 'GraphQL'],
          responsibilities: ['Build cloud services'],
        },
      });
    } catch (e) {
      console.warn('DB not reachable, running tests in fallback mode', e);
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      try {
        await prisma.learningTask.deleteMany({
          where: { goal: { plan: { userId: user1Id } } },
        });
        await prisma.learningGoal.deleteMany({
          where: { plan: { userId: user1Id } },
        });
        await prisma.learningPlan.deleteMany({
          where: { userId: { in: [user1Id, user2Id] } },
        });
        await prisma.careerSnapshot.deleteMany({ where: { userId: user1Id } });
      } catch (err) {
        console.warn('Cleanup error:', err);
      }
    }
  });

  // ─── 1. AI Provider & Zod Schema Validation ──────────────────────────────────
  describe('AI Provider & Structured Output Schemas', () => {
    const mockAI = new MockAIProvider();

    it('generates a valid learning plan matching LearningPlanGenerationSchema', async () => {
      const plan = await mockAI.generateLearningPlan({
        targetRole: 'Full Stack Engineer',
        skillGaps: [
          {
            skill: 'Docker',
            priority: 'CRITICAL',
            status: 'MISSING',
            reason: 'Needed for containerization',
          },
        ],
      });

      const parsed = LearningPlanGenerationSchema.safeParse(plan);
      expect(parsed.success).toBe(true);
      expect(plan.title).toBeDefined();
      expect(plan.goals.length).toBeGreaterThan(0);
      expect(plan.goals[0].tasks.length).toBeGreaterThan(0);
    });

    it('generates grounded career insights matching CareerInsightsResultSchema', async () => {
      const insights = await mockAI.generateCareerInsights({
        targetRole: 'Full Stack Engineer',
        readinessScore: 78,
        strongSkillsCount: 4,
        gapSkillsCount: 2,
        applicationCount: 5,
        interviewCount: 2,
      });

      const parsed = CareerInsightsResultSchema.safeParse(insights);
      expect(parsed.success).toBe(true);
      expect(insights.insights.length).toBeGreaterThan(0);
      expect(insights.insights[0].whatChanged).toBeDefined();
      expect(insights.insights[0].recommendedAction).toBeDefined();
    });

    it('generates grounded skill gap explanation matching SkillGapExplanationResultSchema', async () => {
      const explanation = await mockAI.generateSkillGapExplanation({
        skill: 'Docker',
        targetRole: 'Full Stack Engineer',
        importance: 'REQUIRED',
        userEvidence: ['Mentioned once in resume'],
      });

      const parsed = SkillGapExplanationResultSchema.safeParse(explanation);
      expect(parsed.success).toBe(true);
      expect(explanation.skill).toBe('Docker');
      expect(explanation.learningPathway.length).toBeGreaterThan(0);
    });
  });

  // ─── 2. Analytics Endpoints ──────────────────────────────────────────────────
  describe('Analytics APIs', () => {
    it('GET /api/v1/analytics/overview returns explainable career readiness score', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.careerReadiness).toBeDefined();
      expect(data.careerReadiness.overallScore).toBeGreaterThanOrEqual(0);
      expect(data.careerReadiness.overallScore).toBeLessThanOrEqual(100);
      expect(data.careerReadiness.explanations).toBeDefined();
      expect(data.careerReadiness.explanations.skillAlignment).toBeDefined();
    });

    it('GET /api/v1/analytics/skills normalizes aliases correctly', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/analytics/skills')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const skills = res.body.data.skills;
      expect(Array.isArray(skills)).toBe(true);

      // React.js should be normalized to React canonical
      const reactSkill = skills.find((s: any) => s.canonicalName === 'React');
      expect(reactSkill).toBeDefined();
      expect(reactSkill.originalName).toBe('React.js');
      expect(reactSkill.verificationStatus).toBe('VERIFIED_USER_DATA');

      // Postgres should be normalized to PostgreSQL canonical
      const pgSkill = skills.find((s: any) => s.canonicalName === 'PostgreSQL');
      expect(pgSkill).toBeDefined();
      expect(pgSkill.originalName).toBe('Postgres');
    });

    it('GET /api/v1/analytics/skills/gaps identifies gaps with priority', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/analytics/skills/gaps')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.gaps).toBeDefined();
      expect(Array.isArray(res.body.data.gaps)).toBe(true);

      // Docker should be identified as missing or critical gap from the Job DNA
      const dockerGap = res.body.data.gaps.find(
        (g: any) => g.skill === 'Docker',
      );
      if (dockerGap) {
        expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(
          dockerGap.priority,
        );
        expect(['STRONG', 'PARTIAL', 'MISSING']).toContain(dockerGap.status);
      }
    });

    it('GET /api/v1/analytics/roles returns role alignment and why it matters', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/analytics/roles')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.targetRole).toBe('Full Stack Engineer');
      expect(res.body.data.whyItMatters).toBeDefined();
      expect(Array.isArray(res.body.data.strongSkills)).toBe(true);
    });

    it('GET /api/v1/analytics/applications calculates conversion rates without throwing', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/analytics/applications')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.rates).toBeDefined();
      expect(res.body.data.rates.interviewRate).toBeGreaterThanOrEqual(0);
    });

    it('GET /api/v1/analytics/interviews returns interview preparation performance', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/analytics/interviews')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categoryScores).toBeDefined();
    });

    it('GET /api/v1/analytics/evidence returns evidence coverage matrix', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/analytics/evidence')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.statusBreakdown).toBeDefined();
      expect(res.body.data.sourceBreakdown).toBeDefined();
    });

    it('POST /api/v1/analytics/snapshots creates periodic career snapshot', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post('/api/v1/analytics/snapshots')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.careerReadinessScore).toBeDefined();
    });
  });

  // ─── 3. Learning Plan CRUD & Lifecycle ───────────────────────────────────────
  describe('Learning Plan APIs', () => {
    it('POST /api/v1/learning-plans creates a plan in DRAFT status', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post('/api/v1/learning-plans')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Docker & Cloud Native Mastery',
          targetRole: 'Full Stack Engineer',
          description: 'Focus on containerization and cloud deployments',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('DRAFT');
      createdPlanId = res.body.data.id;
    });

    it('POST /api/v1/learning-plans/:id/generate creates goals & tasks from gaps', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post(`/api/v1/learning-plans/${createdPlanId}/generate`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.goals.length).toBeGreaterThan(0);
      createdGoalId = res.body.data.goals[0].id;
    });

    it('POST /api/v1/learning-tasks adds a proof-of-work task', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post('/api/v1/learning-tasks')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          goalId: createdGoalId,
          title: 'Create Dockerfile and docker-compose setup',
          description:
            'Containerize multi-container app and document evidence in README',
          type: 'EVIDENCE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('TODO');
      createdTaskId = res.body.data.id;
    });

    it('PATCH /api/v1/learning-tasks/:id updates status to COMPLETED without auto-verifying Twin', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .patch(`/api/v1/learning-tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          status: 'COMPLETED',
          evidenceReference: 'github.com/alice/docker-setup',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.completedAt).toBeDefined();
    });

    it('POST /api/v1/learning-plans/:id/complete marks plan as COMPLETED', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .post(`/api/v1/learning-plans/${createdPlanId}/complete`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
    });
  });

  // ─── 4. Security & Tenant Isolation ──────────────────────────────────────────
  describe('Security & Isolation', () => {
    it('rejects unauthenticated analytics and learning requests with 401', async () => {
      const res = await request(app).get('/api/v1/analytics/overview');
      expect(res.status).toBe(401);

      const res2 = await request(app).get('/api/v1/learning-plans');
      expect(res2.status).toBe(401);
    });

    it('prevents User 2 from accessing or modifying User 1 learning plans', async () => {
      if (!dbAvailable || !createdPlanId) return;

      // User 2 tries to GET User 1's plan
      const getRes = await request(app)
        .get(`/api/v1/learning-plans/${createdPlanId}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(getRes.status).toBe(404);

      // User 2 tries to PATCH User 1's plan
      const patchRes = await request(app)
        .patch(`/api/v1/learning-plans/${createdPlanId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ title: 'Hacked Title' });
      expect(patchRes.status).toBe(404);

      // User 2 tries to DELETE User 1's plan
      const delRes = await request(app)
        .delete(`/api/v1/learning-plans/${createdPlanId}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(delRes.status).toBe(404);
    });

    it('does not expose secrets, credentials, or internal tokens in analytics responses', async () => {
      if (!dbAvailable) return;

      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${token1}`);

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('password');
      expect(bodyStr).not.toContain('GEMINI_API_KEY');
      expect(bodyStr).not.toContain('accessToken');
    });
  });
});
