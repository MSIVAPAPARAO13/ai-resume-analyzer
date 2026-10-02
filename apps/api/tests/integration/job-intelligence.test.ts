import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

const SAMPLE_RESUME_PDF = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 380 >> stream
BT /F1 12 Tf 72 712 Td (Jordan Lee) Tj
0 -20 Td (jordan.lee@example.com | +1 555 987 6543 | github.com/jordanlee) Tj
0 -30 Td (Summary) Tj
0 -15 Td (Senior Backend Engineer with 5 years building scalable TypeScript services and RESTful APIs.) Tj
0 -30 Td (Technical Skills) Tj
0 -15 Td (TypeScript, Node.js, PostgreSQL, Docker, Redis, AWS, REST, Git) Tj
0 -30 Td (Experience) Tj
0 -15 Td (Senior Backend Engineer at CloudScale 2021 - Present) Tj
0 -15 Td (- Architected real-time streaming pipeline reducing latency by 40 percent.) Tj
0 -15 Td (- Developed REST APIs and background workers handling 10k requests per second.) Tj
0 -30 Td (Education) Tj
0 -15 Td (Bachelor of Science in Computer Science - Tech Institute 2019) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000674 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
753
%%EOF`;

const SAMPLE_BACKEND_JD = `About the Role:
We are looking for a Senior Backend Engineer to join our Core Platform team. In this role, you will build and maintain high-throughput backend services and scalable microservices.

Responsibilities:
- Architect and develop scalable RESTful APIs using Node.js, TypeScript, and PostgreSQL.
- Implement caching layers and message queues using Redis.
- Collaborate with engineering teams in an Agile environment.
- Design database schemas and write optimized SQL queries.
- Build CI/CD pipelines and containerize services using Docker and AWS.

Requirements:
- 3+ years of professional backend engineering experience.
- Strong proficiency in TypeScript, Node.js, and PostgreSQL.
- Practical experience with REST APIs and automated testing.
- Bachelor's degree in Computer Science or equivalent practical experience.

Preferred Qualifications:
- Experience with Docker, Redis, and AWS cloud infrastructure.
- Familiarity with Kubernetes and microservice architectures.`;

describe('Job Intelligence & Matching End-to-End API Integration', () => {
  const user1Email = `job_user1_${Date.now()}@resumind.dev`;
  const user2Email = `job_user2_${Date.now()}@resumind.dev`;
  const password = 'Password123!';

  let token1 = '';
  let token2 = '';
  let jobId = '';
  let resumeId = '';
  let matchId = '';

  beforeAll(async () => {
    // 1. Register User 1
    const res1 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: user1Email, password, name: 'Jordan Lee' });
    token1 = res1.body.data?.accessToken;

    // Seed Career Twin for User 1
    await request(app)
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        headline: 'Senior Backend Engineer',
        targetRole: 'Senior Backend Engineer',
      });

    await request(app)
      .post('/api/v1/skills')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'TypeScript',
        category: 'Programming',
        proficiency: 'Expert',
      });

    await request(app)
      .post('/api/v1/skills')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'PostgreSQL',
        category: 'Database',
        proficiency: 'Advanced',
      });

    // Upload a test resume for User 1
    const resumeRes = await request(app)
      .post('/api/v1/resumes')
      .set('Authorization', `Bearer ${token1}`)
      .field('title', 'Jordan Lee Master Resume')
      .attach('file', Buffer.from(SAMPLE_RESUME_PDF), 'jordan_lee.pdf');
    resumeId = resumeRes.body.data?.resume?.id;

    // 2. Register User 2
    const res2 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: user2Email, password, name: 'Other User' });
    token2 = res2.body.data?.accessToken;
  }, 30000);

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: { in: [user1Email, user2Email] } },
      });
    } catch {
      // Ignore cleanup error
    }
  });

  describe('1. Security & Input Validation', () => {
    it('POST /api/v1/jobs - rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/v1/jobs').send({
        title: 'Senior Backend Engineer',
        company: 'CloudTech',
        description: SAMPLE_BACKEND_JD,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/jobs - rejects invalid payload with 400', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'A', // too short
          company: '',
          description: 'Short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/jobs - successfully creates a new target job', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Senior Backend Engineer',
          company: 'CloudScale Systems',
          location: 'San Francisco, CA / Remote',
          employmentType: 'Full-time',
          sourceUrl: 'https://example.com/careers/senior-backend',
          description: SAMPLE_BACKEND_JD,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('Senior Backend Engineer');
      expect(res.body.data.company).toBe('CloudScale Systems');
      expect(res.body.data.status).toBe('SAVED');

      jobId = res.body.data.id;
    });
  });

  describe('2. Job CRUD & User Isolation', () => {
    it('GET /api/v1/jobs - lists target jobs for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((j: any) => j.id === jobId)).toBe(true);
    });

    it('GET /api/v1/jobs/:id - retrieves target job by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(jobId);
      expect(res.body.data.company).toBe('CloudScale Systems');
    });

    it('Tenant Isolation: User 2 cannot access User 1 job', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('PUT /api/v1/jobs/:id - updates job details', async () => {
      const res = await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          location: 'San Francisco, CA (100% Remote)',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.location).toBe('San Francisco, CA (100% Remote)');
    });

    it('Tenant Isolation: User 2 cannot update User 1 job', async () => {
      const res = await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ location: 'Hacked Location' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Job DNA Analysis', () => {
    it('POST /api/v1/jobs/:id/analyze - extracts Job DNA and stores requirements', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/analyze`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ANALYZED');
      expect(res.body.data.latestAnalysis).toBeDefined();

      const dna = res.body.data.latestAnalysis.jobDna;
      expect(dna.role).toBe('Senior Backend Engineer');
      expect(dna.roleFamily).toBe('Backend Engineering');
      expect(dna.requiredSkills).toContain('TypeScript');
      expect(dna.requiredSkills).toContain('Node.js');
      expect(dna.preferredSkills).toContain('Docker');
      expect(dna.experienceRequirement.years).toBe(3);

      // Verify persisted requirements in database
      expect(res.body.data.requirements.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/jobs/:id/analysis - retrieves structured Job DNA analysis', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${jobId}/analysis`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.jobDna).toBeDefined();
      expect(res.body.data.role).toBe('Senior Backend Engineer');
    });

    it('Tenant Isolation: User 2 cannot analyze User 1 job', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/analyze`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Resume ↔ Job Matching Engine', () => {
    it('POST /api/v1/jobs/:jobId/match/:resumeId - evaluates match alignment and persists report', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/match/${resumeId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.overallScore).toBeGreaterThanOrEqual(0);
      expect(res.body.data.overallScore).toBeLessThanOrEqual(100);

      // Verify category scores
      expect(res.body.data.skillsScore).toBeGreaterThanOrEqual(70);
      expect(res.body.data.experienceScore).toBeGreaterThanOrEqual(70);
      expect(res.body.data.educationScore).toBeGreaterThanOrEqual(80);

      const result = res.body.data.result;
      expect(result.strongMatches.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);

      matchId = res.body.data.id;
    });

    it('GET /api/v1/jobs/:jobId/matches - lists all matches for the target job', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${jobId}/matches`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((m: any) => m.id === matchId)).toBe(true);
    });

    it('GET /api/v1/jobs/:jobId/matches/:matchId - retrieves detailed match report', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${jobId}/matches/${matchId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(matchId);
      expect(res.body.data.result.scores).toBeDefined();
      expect(res.body.data.result.strongMatches).toBeDefined();
      expect(res.body.data.result.partialMatches).toBeDefined();
      expect(res.body.data.result.missingRequirements).toBeDefined();
    });

    it('Tenant Isolation: User 2 cannot access User 1 match report', async () => {
      const res = await request(app)
        .get(`/api/v1/jobs/${jobId}/matches/${matchId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('Tenant Isolation: User 2 cannot match User 1 job', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${jobId}/match/${resumeId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Job Deletion & Cascading', () => {
    it('DELETE /api/v1/jobs/:id - successfully deletes job and cascades', async () => {
      const res = await request(app)
        .delete(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify job is removed
      const checkRes = await request(app)
        .get(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${token1}`);
      expect(checkRes.status).toBe(404);

      // Verify cascaded match is also removed
      const matchCheck = await prisma.jobMatch.findUnique({
        where: { id: matchId },
      });
      expect(matchCheck).toBeNull();
    });
  });
});
