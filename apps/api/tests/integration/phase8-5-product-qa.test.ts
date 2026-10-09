import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { signAccessToken } from '../../src/utils/tokens.js';
import {
  SAMPLE_USER,
  SAMPLE_CAREER_TWIN,
  SAMPLE_JOBS,
  SAMPLE_RESUME_TEXT,
} from '../../src/fixtures/sample-data.js';
import { EvidenceGuardService } from '../../src/modules/resume/tailoring/evidence-guard.service.js';
import type { TailoringSuggestion } from '../../src/modules/resume/ai/ai.interface.js';
import type { ParsedResumeData } from '../../src/modules/resume/parser/section.parser.js';

describe('Phase 8.5 — Product QA & Sample Data Verification', () => {
  const guardService = new EvidenceGuardService();

  describe('Sample Data Integrity & Realism', () => {
    it('verifies synthetic user profile meets requirements', () => {
      expect(SAMPLE_USER.name).toBe('Alex Morgan');
      expect(SAMPLE_USER.email).toBe('alex.morgan.qa@resumind.dev');
      expect(SAMPLE_USER.role).toBe('USER');
    });

    it('verifies Career Twin contains all required realistic skills, projects, and education', () => {
      expect(SAMPLE_CAREER_TWIN.targetRole).toBe('Full Stack Developer');
      expect(SAMPLE_CAREER_TWIN.targetLevel).toBe('Entry Level');

      const skillNames = SAMPLE_CAREER_TWIN.skills.map((s) => s.name);
      expect(skillNames).toContain('JavaScript');
      expect(skillNames).toContain('TypeScript');
      expect(skillNames).toContain('React');
      expect(skillNames).toContain('Node.js');
      expect(skillNames).toContain('Express');
      expect(skillNames).toContain('PostgreSQL');
      expect(skillNames).toContain('MongoDB');
      expect(skillNames).toContain('Python');
      expect(skillNames).toContain('Git');
      expect(skillNames).toContain('REST APIs');
      expect(skillNames).toContain('Docker');

      const projectNames = SAMPLE_CAREER_TWIN.projects.map((p) => p.name);
      expect(projectNames).toContain('TradeFlow');
      expect(projectNames).toContain('AI Career Assistant');
      expect(projectNames).toContain('ML Prediction System');

      expect(SAMPLE_CAREER_TWIN.education[0].degree).toContain('Engineering');
      expect(SAMPLE_CAREER_TWIN.certifications.length).toBeGreaterThanOrEqual(
        2,
      );
      expect(SAMPLE_CAREER_TWIN.achievements.length).toBeGreaterThanOrEqual(2);
    });

    it('verifies the 3 synthetic jobs distinguish required vs preferred skills', () => {
      expect(SAMPLE_JOBS).toHaveLength(3);

      const job1 = SAMPLE_JOBS[0]; // Full Stack Developer
      expect(job1.title).toBe('Full Stack Developer');
      const job1Required = job1.requirements
        .filter((r) => r.importance === 'REQUIRED')
        .map((r) => r.name);
      const job1Preferred = job1.requirements
        .filter((r) => r.importance === 'PREFERRED')
        .map((r) => r.name);
      expect(job1Required).toContain('React');
      expect(job1Required).toContain('Node.js');
      expect(job1Preferred).toContain('Docker');

      const job2 = SAMPLE_JOBS[1]; // Frontend Developer
      expect(job2.title).toBe('Frontend Developer');
      const job2Required = job2.requirements
        .filter((r) => r.importance === 'REQUIRED')
        .map((r) => r.name);
      expect(job2Required).toContain('React');
      expect(job2Required).toContain('JavaScript');

      const job3 = SAMPLE_JOBS[2]; // Software Engineer
      expect(job3.title).toBe('Software Engineer');
      const job3Required = job3.requirements
        .filter((r) => r.importance === 'REQUIRED')
        .map((r) => r.name);
      const job3Preferred = job3.requirements
        .filter((r) => r.importance === 'PREFERRED')
        .map((r) => r.name);
      expect(job3Required).toContain('Node.js');
      expect(job3Preferred).toContain('AWS');
    });

    it('verifies sample resume contains all core sections and text', () => {
      expect(SAMPLE_RESUME_TEXT).toContain('ALEX MORGAN');
      expect(SAMPLE_RESUME_TEXT).toContain('PROFESSIONAL SUMMARY');
      expect(SAMPLE_RESUME_TEXT).toContain('TECHNICAL SKILLS');
      expect(SAMPLE_RESUME_TEXT).toContain('PROJECTS');
      expect(SAMPLE_RESUME_TEXT).toContain('TradeFlow');
      expect(SAMPLE_RESUME_TEXT).toContain('EDUCATION');
    });
  });

  describe('Evidence Guard — AI Hallucination & Metric Guarding', () => {
    const mockParsedResume: ParsedResumeData = {
      contact: {
        name: 'Alex Morgan',
        email: 'alex.morgan.qa@resumind.dev',
      },
      summary: SAMPLE_CAREER_TWIN.summary,
      skills: SAMPLE_CAREER_TWIN.skills.map((s) => ({
        name: s.name,
        category: s.category,
      })),
      experience: [],
      education: SAMPLE_CAREER_TWIN.education.map((e) => ({
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.fieldOfStudy,
      })),
      projects: SAMPLE_CAREER_TWIN.projects.map((p) => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies,
      })),
      certifications: [],
      rawText: SAMPLE_RESUME_TEXT,
    };

    it('flags unverified 35% performance metric as UNSUPPORTED when no such metric exists in profile', () => {
      const suggestions: TailoringSuggestion[] = [
        {
          id: 'sug-hallucinated-metric',
          section: 'projects',
          original: 'Developed TradeFlow full-stack asset trading dashboard.',
          proposed:
            'Engineered TradeFlow dashboard achieving a 35% performance improvement and 50% reduced latency.',
          reasoning: 'Add quantified performance metrics to highlight impact.',
          changeType: 'enhance',
          keywordsAddressed: ['Performance'],
        },
      ];

      const result = guardService.evaluateSuggestions(
        suggestions,
        SAMPLE_CAREER_TWIN,
        mockParsedResume,
      );

      expect(result.unsupportedCount).toBeGreaterThanOrEqual(1);
      const flagged = result.suggestions[0];
      expect(flagged.guardStatus).toBe('UNSUPPORTED');
      expect(
        flagged.detectedUnsupportedClaims.some((c) => c.includes('35%')),
      ).toBe(true);
    });

    it('flags ungrounded technologies (e.g. AWS, Kubernetes) not present in candidate evidence', () => {
      const suggestions: TailoringSuggestion[] = [
        {
          id: 'sug-hallucinated-tech',
          section: 'projects',
          original: 'Built trading backend with Node.js and Express.',
          proposed:
            'Orchestrated multi-region AWS Kubernetes cluster for trading backend with Kafka streaming.',
          reasoning: 'Add cloud infrastructure keywords.',
          changeType: 'add',
          keywordsAddressed: ['AWS', 'Kubernetes'],
        },
      ];

      const result = guardService.evaluateSuggestions(
        suggestions,
        SAMPLE_CAREER_TWIN,
        mockParsedResume,
      );

      expect(result.unsupportedCount).toBeGreaterThanOrEqual(1);
      const flagged = result.suggestions[0];
      expect(flagged.guardStatus).toBe('UNSUPPORTED');
      expect(
        flagged.detectedUnsupportedClaims.some(
          (c) =>
            c.toLowerCase().includes('aws') ||
            c.toLowerCase().includes('kubernetes'),
        ),
      ).toBe(true);
    });

    it('approves grounded enhancements referencing verified Career Twin skills and projects', () => {
      const suggestions: TailoringSuggestion[] = [
        {
          id: 'sug-grounded-enhancement',
          section: 'projects',
          original: 'Built TradeFlow dashboard with React and Express.',
          proposed:
            'Developed TradeFlow full-stack portfolio dashboard utilizing React, Express, and PostgreSQL for structured data persistence.',
          reasoning:
            'Highlight PostgreSQL database expertise demonstrated in Career Twin.',
          changeType: 'enhance',
          keywordsAddressed: ['PostgreSQL', 'React'],
          confidence: 0.9,
          evidenceReferences: [
            {
              source: 'CAREER_TWIN',
              type: 'SKILL',
              label: 'PostgreSQL',
            },
          ],
        },
      ];

      const result = guardService.evaluateSuggestions(
        suggestions,
        SAMPLE_CAREER_TWIN,
        mockParsedResume,
      );

      const verified = result.suggestions[0];
      expect(verified.guardStatus).toBe('VERIFIED');
      expect(result.verifiedCount).toBe(1);
    });
  });

  describe('Multi-Tenant User Isolation & Route Robustness', () => {
    const userAId = '11111111-aaaa-bbbb-cccc-111111111111';
    const userBId = '22222222-aaaa-bbbb-cccc-222222222222';
    const tokenUserA = signAccessToken({
      userId: userAId,
      email: 'userA@resumind.dev',
      role: 'USER',
    });
    const tokenUserB = signAccessToken({
      userId: userBId,
      email: 'userB@resumind.dev',
      role: 'USER',
    });

    it('rejects unauthenticated requests to protected endpoints', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect([401, 403]).toContain(res.status);
    });

    it('ensures User A and User B tokens have distinct identities', () => {
      expect(tokenUserA).not.toBe(tokenUserB);
    });

    it('verifies non-existent API routes return 404', async () => {
      const res = await request(app)
        .get('/api/v1/non-existent-endpoint-test')
        .set('Authorization', `Bearer ${tokenUserA}`);
      expect(res.status).toBe(404);
    });
  });
});
