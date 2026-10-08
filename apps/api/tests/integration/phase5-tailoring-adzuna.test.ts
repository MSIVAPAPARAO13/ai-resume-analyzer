import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll, vi } from 'vitest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { signAccessToken } from '../../src/utils/tokens.js';

const SAMPLE_RESUME_PDF = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 380 >> stream
BT /F1 12 Tf 72 712 Td (Samantha Carter) Tj
0 -20 Td (samantha@example.com | +1 555 999 8888) Tj
0 -30 Td (Summary) Tj
0 -15 Td (Full Stack Engineer with 4 years building web apps in React, Node.js, and TypeScript.) Tj
0 -30 Td (Technical Skills) Tj
0 -15 Td (TypeScript, React, Node.js, PostgreSQL) Tj
0 -30 Td (Experience) Tj
0 -15 Td (Software Developer at AcmeCloud 2022 - Present) Tj
0 -15 Td (- Developed web backend services using Node.js and Express.) Tj
0 -15 Td (- Built customer portals with React and TypeScript.) Tj
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

describe('Phase 5 — Integration Tests: AI Resume Tailoring & Adzuna Job Search', () => {
  const user1Email = `phase5_user1_${Date.now()}@resumind.dev`;
  const user2Email = `phase5_user2_${Date.now()}@resumind.dev`;
  const password = 'Password123!';

  let dbAvailable = false;
  let token1 = '';
  let token2 = '';
  let resumeId = '';
  let jobId = '';
  let sessionId = '';
  let suggestion1Id = '';
  let suggestion2Id = '';

  beforeAll(async () => {
    token1 = signAccessToken({
      userId: '11111111-1111-1111-1111-111111111111',
      email: user1Email,
      role: 'USER',
    });
    token2 = signAccessToken({
      userId: '22222222-2222-2222-2222-222222222222',
      email: user2Email,
      role: 'USER',
    });

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbAvailable = true;
    } catch {
      dbAvailable = false;
      return;
    }

    if (dbAvailable) {
      // 1. Register User 1
      const res1 = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: user1Email, password, name: 'Samantha Carter' });
      token1 = res1.body.data?.accessToken || token1;

      // 2. Register User 2
      const res2 = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: user2Email, password, name: 'Daniel Jackson' });
      token2 = res2.body.data?.accessToken || token2;

      // 3. Set Career Twin for User 1
      await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          headline: 'Full Stack Engineer',
          summary:
            'Experienced web engineer building modern scalable applications',
        });

      await request(app)
        .post('/api/v1/skills')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Node.js',
          category: 'Backend',
          proficiency: 'Advanced',
        });

      // 4. Upload Resume for User 1
      const uploadRes = await request(app)
        .post('/api/v1/resumes')
        .set('Authorization', `Bearer ${token1}`)
        .attach('file', Buffer.from(SAMPLE_RESUME_PDF), 'samantha_resume.pdf');

      resumeId = uploadRes.body.data?.resume?.id || uploadRes.body.data?.id;

      // 5. Create Job for User 1
      const jobRes = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Senior Node.js Backend Engineer',
          company: 'Stargate Systems',
          location: 'Remote',
          employmentType: 'Full-time',
          description: `We are looking for a Senior Node.js Backend Engineer to lead backend architecture.
Requirements:
- 3+ years experience with Node.js and TypeScript.
- Strong knowledge of PostgreSQL and REST APIs.
- Experience with high reliability and scalable architectures.`,
        });

      jobId = jobRes.body.data?.id;

      // Analyze job to produce Job DNA
      await request(app)
        .post(`/api/v1/jobs/${jobId}/analyze`)
        .set('Authorization', `Bearer ${token1}`);
    }
  });

  afterAll(async () => {
    if (dbAvailable) {
      try {
        await (prisma as any).user.deleteMany({
          where: { email: { in: [user1Email, user2Email] } },
        });
      } catch {
        // Ignored
      }
    }
  });

  // ─── 1. Security & Authentication Checks ───────────────────────────────────

  describe('Security & Isolation Guards', () => {
    it('rejects tailoring without authentication (401)', async () => {
      const res = await request(app).post(
        `/api/v1/resumes/dummy-id/tailor/dummy-job`,
      );
      expect(res.status).toBe(401);
    });

    it('rejects job search without authentication (401)', async () => {
      const res = await request(app).get('/api/v1/job-search?q=engineer');
      expect(res.status).toBe(401);
    });

    it('rejects job import without authentication (401)', async () => {
      const res = await request(app).post('/api/v1/job-search/import').send({
        title: 'Engineer',
        company: 'Corp',
        description: 'Test',
      });
      expect(res.status).toBe(401);
    });

    it('rejects salary estimate without authentication (401)', async () => {
      const res = await request(app).get(
        '/api/v1/job-search/salary-estimate?title=Engineer',
      );
      expect(res.status).toBe(401);
    });
  });

  // ─── 2. AI Resume Tailoring Generation & Evidence Guard ────────────────────

  describe('AI Resume Tailoring Workflow', () => {
    it('prevents unauthorized users from tailoring unowned resumes (404/isolation)', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post(`/api/v1/resumes/${resumeId}/tailor/${jobId}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(res.status).toBe(404);
    });

    it('generates a tailoring session with Evidence Guard audited suggestions', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post(`/api/v1/resumes/${resumeId}/tailor/${jobId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ forceRefresh: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.session).toBeDefined();
      expect(data.session.id).toBeDefined();
      sessionId = data.session.id;

      const suggestions = data.session.suggestions;
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      // Verify Evidence Guard statuses are populated
      for (const sug of suggestions) {
        expect(['VERIFIED', 'NEEDS_REVIEW', 'UNSUPPORTED']).toContain(
          sug.guardStatus,
        );
        expect(sug.status).toBe('PENDING');
        expect(sug.requiresUserApproval).toBe(true);
      }

      suggestion1Id = suggestions[0].id;
      suggestion2Id =
        suggestions.length > 1 ? suggestions[1].id : suggestions[0].id;
    });

    it('reuses existing tailoring session when inputs are unchanged (Cost Control)', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post(`/api/v1/resumes/${resumeId}/tailor/${jobId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ forceRefresh: false });

      expect(res.status).toBe(200);
      expect(res.body.data.cached).toBe(true);
      expect(res.body.data.session.id).toBe(sessionId);
    });

    it('User 2 cannot access User 1 tailoring session', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .get(`/api/v1/tailoring/${sessionId}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(res.status).toBe(404);
    });

    it('User 1 can retrieve session details with suggestions', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .get(`/api/v1/tailoring/${sessionId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(sessionId);
      expect(res.body.data.suggestions.length).toBeGreaterThan(0);
    });

    it('allows User 1 to accept a suggestion', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post(
          `/api/v1/tailoring/${sessionId}/suggestions/${suggestion1Id}/accept`,
        )
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACCEPTED');
    });

    it('allows User 1 to reject a suggestion', async () => {
      if (!dbAvailable || suggestion1Id === suggestion2Id) return;
      const res = await request(app)
        .post(
          `/api/v1/tailoring/${sessionId}/suggestions/${suggestion2Id}/reject`,
        )
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
    });

    it('User 2 cannot accept suggestions on User 1 session', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .post(
          `/api/v1/tailoring/${sessionId}/suggestions/${suggestion1Id}/accept`,
        )
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
    });

    it('completes the tailoring session, creates a new ResumeVersion, and scores it', async () => {
      if (!dbAvailable) return;
      // First check existing versions count
      const initialVersions = await request(app)
        .get(`/api/v1/resumes/${resumeId}/versions`)
        .set('Authorization', `Bearer ${token1}`);
      const initialCount =
        initialVersions.body.data?.versions?.length ??
        initialVersions.body.data?.length ??
        0;

      // Complete session
      const completeRes = await request(app)
        .post(`/api/v1/tailoring/${sessionId}/complete`)
        .set('Authorization', `Bearer ${token1}`);

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.success).toBe(true);
      expect(completeRes.body.data.session.status).toBe('COMPLETED');
      expect(completeRes.body.data.newVersion).toBeDefined();

      const newVersion = completeRes.body.data.newVersion;
      expect(newVersion.versionNumber).toBeGreaterThan(1);

      // Verify versions list now has new version
      const updatedVersions = await request(app)
        .get(`/api/v1/resumes/${resumeId}/versions`)
        .set('Authorization', `Bearer ${token1}`);
      const updatedCount =
        updatedVersions.body.data?.versions?.length ??
        updatedVersions.body.data?.length ??
        0;
      expect(updatedCount).toBe(initialCount + 1);

      // Verify that analysis was automatically run for the new version
      const analysisRes = await request(app)
        .get(`/api/v1/resumes/${resumeId}/analysis`)
        .set('Authorization', `Bearer ${token1}`);
      expect(analysisRes.status).toBe(200);
      const analysisData =
        analysisRes.body.data?.analysis ?? analysisRes.body.data;
      expect(analysisData.version?.id || analysisData.versionId).toBe(
        newVersion.id,
      );
      expect(analysisData.overallScore).toBeGreaterThan(0);
    });
  });

  // ─── 3. Adzuna Job Discovery & Import ──────────────────────────────────────

  describe('Adzuna Job Discovery & Import Flow', () => {
    let importedJobId = '';

    beforeAll(() => {
      // Mock global fetch for Adzuna API calls in test environment
      vi.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
        const urlStr = String(url);
        if (urlStr.includes('api.adzuna.com')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              count: 42,
              results: [
                {
                  id: '77889900',
                  title: 'Full Stack <b>Node.js</b> Developer',
                  company: { display_name: 'Starlight Tech' },
                  location: { display_name: 'Bangalore, India' },
                  description:
                    'Develop high-scale cloud web services using Node.js, Express, and React.',
                  salary_min: 1400000,
                  salary_max: 2000000,
                  redirect_url: 'https://adzuna.in/land/ad/77889900',
                  created: '2026-10-02T12:00:00Z',
                },
                {
                  id: '77889901',
                  title: 'Senior Backend Engineer',
                  company: { display_name: 'Nebula Labs' },
                  location: { display_name: 'Remote, India' },
                  description: 'Build microservices and backend pipelines.',
                  salary_min: 1800000,
                  salary_max: 2500000,
                  redirect_url: 'https://adzuna.in/land/ad/77889901',
                  created: '2026-10-02T14:00:00Z',
                },
              ],
            }),
          } as any;
        }
        return { ok: false, status: 404 } as any;
      });
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    it('searches jobs through backend Adzuna proxy and returns normalized results', async () => {
      // Temporarily ensure test credentials so provider doesn't throw 503
      process.env.ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || 'test-adzuna-id';
      process.env.ADZUNA_APP_KEY =
        process.env.ADZUNA_APP_KEY || 'test-adzuna-key';

      const res = await request(app)
        .get('/api/v1/job-search?q=Node.js&location=India&country=in')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.results.length).toBe(2);
      expect(data.total).toBe(42);

      const firstJob = data.results[0];
      expect(firstJob.id).toBe('adzuna-77889900');
      expect(firstJob.title).toBe('Full Stack Node.js Developer'); // HTML stripped
      expect(firstJob.company).toBe('Starlight Tech');
      expect(firstJob.source).toBe('ADZUNA');
      expect(firstJob.sourceUrl).toBe('https://adzuna.in/land/ad/77889900');
    });

    it('imports an Adzuna job and automatically extracts Job DNA', async () => {
      if (!dbAvailable) return;
      const importPayload = {
        title: 'Full Stack Node.js Developer',
        company: 'Starlight Tech',
        location: 'Bangalore, India',
        description:
          'Develop high-scale cloud web services using Node.js, Express, and React.',
        sourceUrl: 'https://adzuna.in/land/ad/77889900',
        employmentType: 'Full-time',
      };

      const res = await request(app)
        .post('/api/v1/job-search/import')
        .set('Authorization', `Bearer ${token1}`)
        .send(importPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.source).toBe('ADZUNA');
      expect(res.body.data.sourceUrl).toBe(importPayload.sourceUrl);
      expect(res.body.alreadyImported).toBe(false);

      importedJobId = res.body.data.id;

      // Verify Job DNA was extracted
      const jobCheck = await request(app)
        .get(`/api/v1/jobs/${importedJobId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(jobCheck.status).toBe(200);
      expect(jobCheck.body.data.title).toBe(importPayload.title);
      expect(jobCheck.body.data.requirements.length).toBeGreaterThan(0);
    });

    it('handles duplicate imports gracefully by returning existing job record', async () => {
      if (!dbAvailable) return;
      const importPayload = {
        title: 'Full Stack Node.js Developer',
        company: 'Starlight Tech',
        location: 'Bangalore, India',
        description:
          'Develop high-scale cloud web services using Node.js, Express, and React.',
        sourceUrl: 'https://adzuna.in/land/ad/77889900',
      };

      const res = await request(app)
        .post('/api/v1/job-search/import')
        .set('Authorization', `Bearer ${token1}`)
        .send(importPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(importedJobId);
      expect(res.body.alreadyImported).toBe(true);
    });

    it('User 2 cannot access User 1 imported job', async () => {
      if (!dbAvailable) return;
      const res = await request(app)
        .get(`/api/v1/jobs/${importedJobId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
    });
  });
});
