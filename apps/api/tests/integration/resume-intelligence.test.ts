import request from 'supertest';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

// Minimal valid PDF with sample resume content
const SAMPLE_RESUME_PDF = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 380 >> stream
BT /F1 12 Tf 72 712 Td (Alex Mercer) Tj
0 -20 Td (alex.mercer@example.com | +1 555 123 4567 | github.com/alexmercer) Tj
0 -30 Td (Summary) Tj
0 -15 Td (Passionate Senior Full Stack Engineer with 7 years of experience building scalable TypeScript applications.) Tj
0 -30 Td (Technical Skills) Tj
0 -15 Td (TypeScript, React, Node.js, PostgreSQL, Docker, Redis, AWS) Tj
0 -30 Td (Experience) Tj
0 -15 Td (Senior Engineer at CloudCorp 2021 - Present) Tj
0 -15 Td (- Architected real-time analytics pipeline reducing latency by 45 percent for 100k users.) Tj
0 -15 Td (- Built scalable REST and GraphQL endpoints handling 5k req/s.) Tj
0 -30 Td (Education) Tj
0 -15 Td (Bachelor of Science in Computer Science - Tech University 2017) Tj
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

describe('Resume Intelligence End-to-End API Integration', () => {
  const user1Email = `resume_user1_${Date.now()}@resumind.dev`;
  const user2Email = `resume_user2_${Date.now()}@resumind.dev`;
  const password = 'Password123!';

  let token1 = '';
  let token2 = '';
  let resumeId = '';
  let versionId = '';

  beforeAll(async () => {
    // 1. Register User 1
    const res1 = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: user1Email, password, name: 'Alex Mercer' });
    token1 = res1.body.data?.accessToken;

    // Seed Career Twin for User 1 to test Career Twin comparison
    await request(app)
      .put('/api/v1/profile')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        headline: 'Senior Full Stack Engineer',
        targetRole: 'Staff Engineer',
      });

    await request(app)
      .post('/api/v1/skills')
      .set('Authorization', `Bearer ${token1}`)
      .send({ name: 'TypeScript', category: 'Programming' });

    await request(app)
      .post('/api/v1/skills')
      .set('Authorization', `Bearer ${token1}`)
      .send({ name: 'Python', category: 'Programming' }); // In Twin only

    // 2. Register User 2 for isolation tests
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

  describe('1. Security & Upload Validation', () => {
    it('POST /api/v1/resumes - rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/v1/resumes')
        .attach('file', Buffer.from(SAMPLE_RESUME_PDF), 'resume.pdf');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/resumes - rejects unsupported file types with 400', async () => {
      const res = await request(app)
        .post('/api/v1/resumes')
        .set('Authorization', `Bearer ${token1}`)
        .attach('file', Buffer.from('console.log("malicious")'), 'script.js');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('POST /api/v1/resumes - rejects request without file with 400', async () => {
      const res = await request(app)
        .post('/api/v1/resumes')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/resumes - successfully uploads and parses valid PDF resume', async () => {
      const res = await request(app)
        .post('/api/v1/resumes')
        .set('Authorization', `Bearer ${token1}`)
        .field('title', 'Alex Mercer Resume 2026')
        .attach('file', Buffer.from(SAMPLE_RESUME_PDF), 'alex_mercer.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resume).toBeDefined();
      expect(res.body.data.resume.title).toBe('Alex Mercer Resume 2026');
      expect(res.body.data.resume.status).toBe('READY');
      expect(res.body.data.version).toBeDefined();
      expect(res.body.data.version.versionNumber).toBe(1);
      expect(res.body.data.version.extractedText).toContain('Alex Mercer');
      expect(res.body.data.version.parsedData).toBeDefined();
      expect(res.body.data.version.parsedData.contact.email).toBe(
        'alex.mercer@example.com',
      );
      expect(res.body.data.version.parsedData.skills.length).toBeGreaterThan(0);

      resumeId = res.body.data.resume.id;
      versionId = res.body.data.version.id;
    }, 30000);
  });

  describe('2. Resume Retrieval & Listing', () => {
    it('GET /api/v1/resumes - lists user resumes with version and status', async () => {
      const res = await request(app)
        .get('/api/v1/resumes')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resumes.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.resumes.some((r: any) => r.id === resumeId)).toBe(
        true,
      );
    });

    it('GET /api/v1/resumes/:id - returns full resume with versions', async () => {
      const res = await request(app)
        .get(`/api/v1/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resume.id).toBe(resumeId);
      expect(res.body.data.resume.versions.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/resumes/:id/versions - lists versions', async () => {
      const res = await request(app)
        .get(`/api/v1/resumes/${resumeId}/versions`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.versions.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/resumes/:id/versions/:versionId - returns specific version text and parsedData', async () => {
      const res = await request(app)
        .get(`/api/v1/resumes/${resumeId}/versions/${versionId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version.id).toBe(versionId);
      expect(res.body.data.version.parsedData).toBeDefined();
    });
  });

  describe('3. Resume Analysis, Scoring, & Career Twin Comparison', () => {
    it('POST /api/v1/resumes/:id/analyze - runs explainable scoring and Career Twin comparison', async () => {
      const res = await request(app)
        .post(`/api/v1/resumes/${resumeId}/analyze`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { scores, careerComparison, aiInsights, analysis } = res.body.data;

      // 1. Validate Scores
      expect(scores).toBeDefined();
      expect(scores.overallScore).toBeGreaterThan(0);
      expect(scores.overallScore).toBeLessThanOrEqual(100);
      expect(scores.atsScore).toBeGreaterThanOrEqual(0);
      expect(scores.contentScore).toBeGreaterThanOrEqual(0);
      expect(scores.skillsScore).toBeGreaterThanOrEqual(0);
      expect(scores.experienceScore).toBeGreaterThanOrEqual(0);
      expect(scores.educationScore).toBeGreaterThanOrEqual(0);
      expect(scores.formattingScore).toBeGreaterThanOrEqual(0);
      expect(scores.topStrengths.length).toBeGreaterThan(0);
      expect(scores.topImprovements.length).toBeGreaterThan(0);

      // 2. Validate Career Twin Comparison
      expect(careerComparison).toBeDefined();
      expect(careerComparison.hasTwin).toBe(true);
      expect(careerComparison.skills.presentInBoth).toContain('TypeScript');
      expect(careerComparison.skills.inTwinOnly).toContain('Python'); // In twin but not resume
      expect(careerComparison.skills.inResumeOnly.length).toBeGreaterThan(0); // e.g. Docker, Redis

      // 3. Validate AI Insights
      expect(aiInsights).toBeDefined();
      expect(aiInsights.summaryCritique).toBeDefined();

      // 4. Validate Persisted Analysis Record
      expect(analysis.id).toBeDefined();
      expect(analysis.overallScore).toBe(scores.overallScore);
    });

    it('GET /api/v1/resumes/:id/analysis - retrieves latest analysis', async () => {
      const res = await request(app)
        .get(`/api/v1/resumes/${resumeId}/analysis`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.analysis.overallScore).toBeGreaterThan(0);
      expect(res.body.data.analysis.result).toBeDefined();
    });
  });

  describe('4. Strict Ownership & Tenant Isolation', () => {
    it('User 2 cannot read User 1 resume (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User 2 cannot analyze User 1 resume (returns 404)', async () => {
      const res = await request(app)
        .post(`/api/v1/resumes/${resumeId}/analyze`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User 2 cannot delete User 1 resume (returns 404)', async () => {
      const res = await request(app)
        .delete(`/api/v1/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Resume Deletion', () => {
    it('DELETE /api/v1/resumes/:id - deletes resume and associated records', async () => {
      const res = await request(app)
        .delete(`/api/v1/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion in GET
      const getRes = await request(app)
        .get(`/api/v1/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(getRes.status).toBe(404);
    });
  });
});
