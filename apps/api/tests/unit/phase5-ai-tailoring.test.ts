import { describe, expect, it } from 'vitest';
import {
  TailoringSuggestionSchema,
  EvidenceAnalysisSchema,
  TailoringGenerationResultSchema,
} from '../../src/modules/resume/ai/ai.interface.js';
import { MockAIProvider } from '../../src/modules/resume/ai/mock-ai.provider.js';
import { EvidenceGuardService } from '../../src/modules/resume/tailoring/evidence-guard.service.js';
import { AdzunaProvider } from '../../src/modules/job/providers/adzuna.provider.js';
import { env } from '../../src/config/env.js';

describe('Phase 5 — Unit Tests: AI Intelligence, Evidence Guard & Adzuna', () => {
  describe('1. AI Analysis & Tailoring Contracts (Zod Validation)', () => {
    it('validates a valid TailoringSuggestion', () => {
      const validSuggestion = {
        type: 'REWRITE',
        original: 'Built REST APIs with Node.js',
        proposed:
          'Architected high-throughput REST APIs using Node.js and Express',
        reason: 'Highlights architectural ownership and framework competencies',
        evidenceReferences: ['Resume: Experience[0]', 'CareerTwin: Skills'],
        confidence: 0.95,
        requiresUserApproval: true,
      };

      const result = TailoringSuggestionSchema.safeParse(validSuggestion);
      expect(result.success).toBe(true);
    });

    it('rejects an invalid suggestion type', () => {
      const invalidSuggestion = {
        type: 'INVALID_TYPE',
        original: 'Old text',
        proposed: 'New text',
        reason: 'Reason',
        evidenceReferences: [],
      };

      const result = TailoringSuggestionSchema.safeParse(invalidSuggestion);
      expect(result.success).toBe(false);
    });

    it('validates EvidenceAnalysisSchema', () => {
      const validEvidence = {
        supportedClaims: ['Candidate has 3 years of Node.js experience'],
        unsupportedClaims: [],
        uncertainClaims: [
          'Team leadership is inferred but not directly stated',
        ],
        evidenceReferences: ['Resume: Experience'],
        warnings: [],
      };

      const result = EvidenceAnalysisSchema.safeParse(validEvidence);
      expect(result.success).toBe(true);
    });

    it('validates full TailoringGenerationResultSchema', () => {
      const fullResult = {
        tailoredSummary:
          'Full-stack engineer with expertise in TypeScript and Node.js',
        prioritizedSkills: ['TypeScript', 'Node.js', 'PostgreSQL'],
        suggestions: [
          {
            type: 'SUMMARY_UPDATE',
            original: 'General software developer.',
            proposed: 'Specialized backend engineer with Node.js expertise.',
            reason: 'Directly aligns with backend role requirement.',
            evidenceReferences: ['Resume: Skills'],
            confidence: 0.9,
            requiresUserApproval: true,
          },
        ],
      };

      const parsed = TailoringGenerationResultSchema.safeParse(fullResult);
      expect(parsed.success).toBe(true);
    });
  });

  describe('2. MockAIProvider Deterministic Tailoring', () => {
    const mockAI = new MockAIProvider();

    it('generates structured tailoring suggestions matching candidate evidence and Job DNA', async () => {
      const result = await mockAI.generateTailoringSuggestions({
        resumeText:
          'Software engineer experienced in React, TypeScript, and Node.js.',
        parsedResume: {
          contact: { name: 'Alice Developer' },
          summary: 'Software developer with web experience.',
          skills: [
            { name: 'React', category: 'Frontend' },
            { name: 'Node.js', category: 'Backend' },
            { name: 'TypeScript', category: 'Language' },
          ],
          experience: [
            {
              title: 'Software Engineer',
              company: 'TechCorp',
              description: 'Developed web services and frontend components.',
              isCurrent: true,
              bullets: ['Developed web services with Node.js.'],
            },
          ],
          education: [],
          projects: [],
          certifications: [],
        },
        careerTwin: {
          skills: [
            { name: 'React' },
            { name: 'Node.js' },
            { name: 'PostgreSQL' },
          ],
          projects: [
            {
              name: 'Ecommerce Microservices',
              description: 'Built distributed checkout system',
              technologies: ['Node.js', 'PostgreSQL'],
            },
          ],
        },
        jobDna: {
          role: 'Senior Backend Engineer',
          level: 'Senior',
          skills: [
            { name: 'Node.js', importance: 'REQUIRED' },
            { name: 'PostgreSQL', importance: 'REQUIRED' },
          ],
          responsibilities: ['Build scalable APIs'],
          keywords: ['Microservices', 'Node.js'],
        },
        jobDescription:
          'Looking for a Senior Backend Engineer proficient in Node.js and PostgreSQL.',
      });

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.prioritizedSkills).toContain('Node.js');
      expect(result.suggestions.some((s) => s.type === 'SUMMARY_UPDATE')).toBe(
        true,
      );
      expect(result.suggestions.some((s) => s.type === 'REWRITE')).toBe(true);
    });
  });

  describe('3. Evidence Guard Anti-Hallucination Service', () => {
    const evidenceGuard = new EvidenceGuardService();

    const sampleTwin = {
      skills: [{ name: 'Node.js' }, { name: 'Express' }],
      experiences: [
        {
          title: 'Backend Developer',
          company: 'InnoTech',
          description: 'Maintained REST APIs and database queries.',
        },
      ],
      projects: [],
    };

    const sampleResume = {
      contact: {},
      summary: 'Backend developer with 2 years of experience.',
      skills: [{ name: 'Node.js', category: 'Backend' }],
      experience: [
        {
          title: 'Backend Developer',
          company: 'InnoTech',
          description: 'Maintained REST APIs and database queries.',
          isCurrent: true,
          bullets: ['Maintained REST APIs with Node.js.'],
        },
      ],
      education: [],
      projects: [],
      certifications: [],
    };

    it('classifies grounded suggestions as VERIFIED', () => {
      const suggestions = [
        {
          type: 'REWRITE' as const,
          original: 'Maintained REST APIs with Node.js.',
          proposed:
            'Engineered and scaled production REST APIs utilizing Node.js for InnoTech.',
          reason:
            'Emphasizes technical delivery using candidate verified skills.',
          evidenceReferences: ['Resume: Experience', 'CareerTwin: Skills'],
          confidence: 0.9,
          requiresUserApproval: true,
        },
      ];

      const result = evidenceGuard.evaluateSuggestions(
        suggestions,
        sampleTwin,
        sampleResume,
      );
      expect(result.verifiedCount).toBe(1);
      expect(result.unsupportedCount).toBe(0);
      expect(result.suggestions[0].guardStatus).toBe('VERIFIED');
    });

    it('detects hallucinated metrics and classifies as UNSUPPORTED', () => {
      const suggestions = [
        {
          type: 'REWRITE' as const,
          original: 'Maintained REST APIs with Node.js.',
          proposed:
            'Optimized REST APIs reducing latency by 45% and saving $2M annually.',
          reason: 'Highlights quantified business metrics.',
          evidenceReferences: ['Resume: Experience'],
          confidence: 0.85,
          requiresUserApproval: true,
        },
      ];

      const result = evidenceGuard.evaluateSuggestions(
        suggestions,
        sampleTwin,
        sampleResume,
      );
      expect(result.unsupportedCount).toBe(1);
      expect(result.suggestions[0].guardStatus).toBe('UNSUPPORTED');
      expect(
        result.suggestions[0].detectedUnsupportedClaims.some((c) =>
          c.includes('45%'),
        ),
      ).toBe(true);
    });

    it('detects ungrounded technologies not present in candidate evidence as UNSUPPORTED', () => {
      const suggestions = [
        {
          type: 'REWRITE' as const,
          original: 'Maintained REST APIs with Node.js.',
          proposed:
            'Architected event-driven streaming clusters using Kafka and Kubernetes.',
          reason: 'Aligns with target job tech stack.',
          evidenceReferences: ['Resume: Experience'],
          confidence: 0.85,
          requiresUserApproval: true,
        },
      ];

      const result = evidenceGuard.evaluateSuggestions(
        suggestions,
        sampleTwin,
        sampleResume,
      );
      expect(result.unsupportedCount).toBe(1);
      expect(result.suggestions[0].guardStatus).toBe('UNSUPPORTED');
      expect(
        result.suggestions[0].detectedUnsupportedClaims.some((c) =>
          c.includes('KAFKA'),
        ),
      ).toBe(true);
    });

    it('classifies stylistic improvements without distinct evidence as NEEDS_REVIEW', () => {
      const suggestions = [
        {
          type: 'SUMMARY_UPDATE' as const,
          original: 'Backend developer with 2 years of experience.',
          proposed:
            'Motivated engineer focused on high-quality software craftsmanship.',
          reason: 'General polish of introduction.',
          evidenceReferences: [],
          confidence: 0.7,
          requiresUserApproval: true,
        },
      ];

      const result = evidenceGuard.evaluateSuggestions(
        suggestions,
        sampleTwin,
        sampleResume,
      );
      expect(result.needsReviewCount).toBe(1);
      expect(result.suggestions[0].guardStatus).toBe('NEEDS_REVIEW');
    });
  });

  describe('4. Adzuna Provider Response Normalization', () => {
    const adzuna = new AdzunaProvider();

    it('normalizes raw Adzuna listing correctly into JobSearchResult envelope', () => {
      const rawListing = {
        id: '987654321',
        title: '<strong>Senior Software Engineer</strong>',
        company: { display_name: 'Acme Software Solutions' },
        location: { display_name: 'Bangalore, Karnataka, India' },
        description:
          'Exciting opportunity for a <mark>Node.js</mark> engineer to build cloud systems.',
        salary_min: 1500000,
        salary_max: 2200000,
        redirect_url: 'https://adzuna.in/land/ad/987654321',
        created: '2026-10-01T10:00:00Z',
      };

      // Call internal normalize method
      const normalized = (adzuna as any).normalizeResult(rawListing, 'in');

      expect(normalized.id).toBe('adzuna-987654321');
      expect(normalized.title).toBe('Senior Software Engineer'); // HTML stripped
      expect(normalized.company).toBe('Acme Software Solutions');
      expect(normalized.location).toBe('Bangalore, Karnataka, India');
      expect(normalized.description).toBe(
        'Exciting opportunity for a Node.js engineer to build cloud systems.',
      );
      expect(normalized.salary).toContain('₹');
      expect(normalized.salary).toMatch(/15[,0]+000/);
      expect(normalized.source).toBe('ADZUNA');
      expect(normalized.sourceUrl).toBe('https://adzuna.in/land/ad/987654321');
    });

    it('handles missing salary gracefully', () => {
      const rawListing = {
        id: '111',
        title: 'Developer',
        company: {},
        description: 'Work with us',
      };

      const normalized = (adzuna as any).normalizeResult(rawListing, 'us');
      expect(normalized.salary).toBe('Not disclosed');
      expect(normalized.company).toBe('Confidential Employer');
    });
  });

  describe('5. Optional External Provider Integration Tests', () => {
    it.skipIf(env.RUN_EXTERNAL_AI_TESTS !== 'true' || !env.GEMINI_API_KEY)(
      'calls live Gemini API when explicitly enabled',
      async () => {
        const { GeminiProvider } =
          await import('../../src/modules/resume/ai/gemini.provider.js');
        const gemini = new GeminiProvider();

        const result = await gemini.analyzeResume(
          'Experienced software developer with JavaScript expertise.',
          {
            contact: {},
            summary: 'Software developer',
            skills: [{ name: 'JavaScript', category: 'Language' }],
            experience: [],
            education: [],
            projects: [],
            certifications: [],
          },
        );

        expect(result).toBeDefined();
        expect(Array.isArray(result.suggestedRoles)).toBe(true);
      },
    );
  });
});
