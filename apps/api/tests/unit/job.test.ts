import { describe, expect, it } from 'vitest';
import { DeterministicJobDescriptionParser } from '../../src/modules/job/parser/job-description.parser.js';
import { ResumeJobMatchingEngine } from '../../src/modules/job/matching/resume-job-matching.engine.js';
import {
  createJobSchema,
  jobDnaSchema,
} from '../../src/modules/job/job.validation.js';

const SAMPLE_TECH_JD = `About the Role:
We are seeking a Senior Backend Engineer to build scalable distributed systems and high-throughput REST APIs.

Responsibilities:
- Architect and develop scalable RESTful APIs using Node.js, TypeScript, and PostgreSQL.
- Implement real-time data pipelines and caching layers using Redis.
- Collaborate with frontend engineers to integrate web applications.
- Design database schemas and optimize complex SQL queries.
- Build CI/CD pipelines and containerize services using Docker and AWS.

Requirements:
- 3+ years of professional backend software development experience.
- Strong proficiency in TypeScript, Node.js, and PostgreSQL.
- Practical experience with REST APIs and automated testing.
- Bachelor's degree in Computer Science or equivalent practical experience.

Preferred Qualifications:
- Experience with Docker, Redis, and AWS cloud services.
- Familiarity with Kubernetes and microservice architectures.`;

describe('Job Intelligence Unit Tests', () => {
  describe('1. Job Input Validation Schema', () => {
    it('accepts valid job input', () => {
      const valid = {
        title: 'Senior Backend Engineer',
        company: 'CloudTech',
        location: 'Remote',
        employmentType: 'Full-time',
        sourceUrl: 'https://example.com/jobs/123',
        description: SAMPLE_TECH_JD,
      };

      const result = createJobSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects short descriptions under 20 characters', () => {
      const invalid = {
        title: 'Engineer',
        company: 'CloudTech',
        description: 'Too short',
      };

      const result = createJobSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('2. Deterministic Job Description Parser', () => {
    const parser = new DeterministicJobDescriptionParser();

    it('extracts role, role family, level, and summary correctly', async () => {
      const dna = await parser.parse('Senior Backend Engineer', SAMPLE_TECH_JD);

      expect(dna.role).toBe('Senior Backend Engineer');
      expect(dna.roleFamily).toBe('Backend Engineering');
      expect(dna.level).toBe('Senior');
      expect(dna.summary).toBeDefined();
      expect(dna.summary.length).toBeGreaterThan(20);
    });

    it('separates required skills from preferred skills accurately', async () => {
      const dna = await parser.parse('Senior Backend Engineer', SAMPLE_TECH_JD);

      expect(dna.requiredSkills).toContain('TypeScript');
      expect(dna.requiredSkills).toContain('Node.js');
      expect(dna.requiredSkills).toContain('PostgreSQL');

      expect(dna.preferredSkills).toContain('Docker');
      expect(dna.preferredSkills).toContain('Redis');
      expect(dna.preferredSkills).toContain('AWS');

      // Ensure no intersection between required and preferred
      const intersection = dna.requiredSkills.filter((s) =>
        dna.preferredSkills.includes(s),
      );
      expect(intersection.length).toBe(0);
    });

    it('extracts responsibilities, experience, education, and keywords', async () => {
      const dna = await parser.parse('Senior Backend Engineer', SAMPLE_TECH_JD);

      expect(dna.responsibilities.length).toBeGreaterThanOrEqual(3);
      expect(dna.experienceRequirement.years).toBe(3);
      expect(dna.experienceRequirement.raw).toContain('3+ years');

      expect(dna.educationRequirement.degree).toBe("Bachelor's Degree");
      expect(dna.educationRequirement.field).toBe(
        'Computer Science / Software Engineering',
      );

      expect(dna.keywords.length).toBeGreaterThan(0);
      expect(dna.keywords).toContain('REST');
    });

    it('conforms strictly to JobDnaSchema', async () => {
      const dna = await parser.parse('Senior Backend Engineer', SAMPLE_TECH_JD);
      const validated = jobDnaSchema.safeParse(dna);
      expect(validated.success).toBe(true);
    });
  });

  describe('3. Resume ↔ Job Matching Engine', () => {
    const parser = new DeterministicJobDescriptionParser();
    const engine = new ResumeJobMatchingEngine();

    it('calculates deterministic scores bounded between 0 and 100', async () => {
      const jobDna = await parser.parse(
        'Senior Backend Engineer',
        SAMPLE_TECH_JD,
      );

      const parsedResume = {
        contact: { name: 'Alex Mercer', email: 'alex@example.com' },
        skills: [
          'TypeScript',
          'Node.js',
          'PostgreSQL',
          'Docker',
          'Redis',
          'AWS',
          'Git',
        ],
        experience: [
          {
            title: 'Senior Backend Engineer',
            company: 'TechCorp',
            startDate: '2020-01-01',
            endDate: '2024-01-01',
            highlights: [
              'Architected high-throughput REST APIs using Node.js and PostgreSQL.',
              'Implemented caching pipelines with Redis reducing latency by 45 percent.',
            ],
          },
        ],
        education: [
          {
            institution: 'Tech University',
            degree: 'Bachelor of Science in Computer Science',
            year: '2019',
          },
        ],
      };

      const result = await engine.match({
        parsedResume,
        extractedText:
          'Alex Mercer alex@example.com TypeScript Node.js PostgreSQL Docker Redis AWS REST APIs',
        jobDna,
        careerTwin: null,
      });

      expect(result.scores.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.scores.overallScore).toBeLessThanOrEqual(100);
      expect(result.scores.skillsScore).toBeGreaterThanOrEqual(80);
      expect(result.scores.experienceScore).toBeGreaterThanOrEqual(80);
      expect(result.scores.educationScore).toBe(100);

      // Strong matches should contain key required skills
      const matchedReqs = result.strongMatches.map((m) => m.requirement);
      expect(matchedReqs).toContain('TypeScript');
      expect(matchedReqs).toContain('Node.js');
      expect(matchedReqs).toContain('PostgreSQL');

      // Recommendations should provide actionable preparation tips
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('detects missing requirements and generates neutral guidance', async () => {
      const jobDna = await parser.parse(
        'Senior Backend Engineer',
        SAMPLE_TECH_JD,
      );

      const minimalResume = {
        skills: ['HTML', 'CSS', 'JavaScript'],
        experience: [],
        education: [],
      };

      const result = await engine.match({
        parsedResume: minimalResume,
        extractedText: 'Frontend Developer HTML CSS JavaScript',
        jobDna,
        careerTwin: null,
      });

      expect(result.scores.overallScore).toBeLessThan(60);
      expect(result.missingRequirements.length).toBeGreaterThan(0);

      const missingReqs = result.missingRequirements.map((m) => m.requirement);
      expect(missingReqs).toContain('TypeScript');
      expect(missingReqs).toContain('PostgreSQL');

      // Ensure guidance is neutral and helpful
      const tsMissing = result.missingRequirements.find(
        (m) => m.requirement === 'TypeScript',
      );
      expect(tsMissing?.suggestion).toContain('Add verifiable experience');
    });

    it('rewards Career Twin evidence even if concise in resume', async () => {
      const jobDna = await parser.parse(
        'Senior Backend Engineer',
        SAMPLE_TECH_JD,
      );

      const resumeWithoutAws = {
        skills: ['TypeScript', 'Node.js', 'PostgreSQL'],
        experience: [],
        education: [],
      };

      const careerTwinWithAws = {
        skills: [
          { name: 'TypeScript', proficiency: 'Expert' },
          { name: 'Node.js', proficiency: 'Expert' },
          { name: 'PostgreSQL', proficiency: 'Advanced' },
          { name: 'AWS', proficiency: 'Advanced' },
          { name: 'Docker', proficiency: 'Intermediate' },
        ],
        experiences: [
          {
            title: 'Software Engineer',
            company: 'Cloud Corp',
            startDate: new Date('2020-01-01'),
            endDate: new Date('2024-01-01'),
            isCurrent: false,
            description: 'Built AWS services and managed Docker containers.',
          },
        ],
        education: [
          {
            degree: "Bachelor's Degree",
            institution: 'State University',
            fieldOfStudy: 'Computer Science',
          },
        ],
        projects: [
          {
            name: 'Analytics API',
            description: 'Backend analytics service on AWS',
            technologies: ['AWS', 'Docker', 'PostgreSQL'],
          },
        ],
      };

      const withoutTwin = await engine.match({
        parsedResume: resumeWithoutAws,
        extractedText: 'TypeScript Node.js PostgreSQL',
        jobDna,
        careerTwin: null,
      });

      const withTwin = await engine.match({
        parsedResume: resumeWithoutAws,
        extractedText: 'TypeScript Node.js PostgreSQL',
        jobDna,
        careerTwin: careerTwinWithAws,
      });

      expect(withTwin.scores.overallScore).toBeGreaterThan(
        withoutTwin.scores.overallScore,
      );
      expect(withTwin.scores.careerTwinScore).toBeGreaterThan(
        withoutTwin.scores.careerTwinScore,
      );

      // AWS should be a strong match through Career Twin evidence
      const matchedReqs = withTwin.strongMatches.map((m) => m.requirement);
      expect(matchedReqs).toContain('AWS');
    });
  });
});
