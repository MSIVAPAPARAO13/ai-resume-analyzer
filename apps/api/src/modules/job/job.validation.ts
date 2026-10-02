import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(2, 'Job title must be at least 2 characters').max(200),
  company: z.string().min(1, 'Company name is required').max(200),
  location: z.string().max(200).optional().nullable(),
  employmentType: z.string().max(100).optional().nullable(),
  sourceUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  description: z
    .string()
    .min(20, 'Job description must be at least 20 characters'),
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(['SAVED', 'ANALYZED', 'ARCHIVED']).optional(),
});

export const jobDnaSkillSchema = z.object({
  name: z.string(),
  category: z.string().optional(),
  importance: z.enum(['REQUIRED', 'PREFERRED', 'NICE_TO_HAVE']),
  evidence: z.string().optional(),
});

export const jobDnaSchema = z.object({
  role: z.string(),
  roleFamily: z.string(),
  level: z.string(),
  summary: z.string(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  experienceRequirement: z.object({
    years: z.number().nullable(),
    raw: z.string(),
    details: z.string().optional(),
  }),
  educationRequirement: z.object({
    degree: z.string().nullable(),
    field: z.string().nullable(),
    raw: z.string(),
  }),
  keywords: z.array(z.string()),
});

export const matchResultItemSchema = z.object({
  requirement: z.string(),
  type: z.enum([
    'SKILL',
    'RESPONSIBILITY',
    'EXPERIENCE',
    'EDUCATION',
    'KEYWORD',
  ]),
  importance: z.enum(['REQUIRED', 'PREFERRED', 'NICE_TO_HAVE']),
  status: z.enum([
    'STRONG_MATCH',
    'PARTIAL_MATCH',
    'MISSING',
    'NOT_APPLICABLE',
  ]),
  evidence: z.string().optional(),
  gap: z.string().optional(),
  suggestion: z.string().optional(),
});

export const matchScoreBreakdownSchema = z.object({
  overallScore: z.number().min(0).max(100),
  skillsScore: z.number().min(0).max(100),
  experienceScore: z.number().min(0).max(100),
  responsibilitiesScore: z.number().min(0).max(100),
  educationScore: z.number().min(0).max(100),
  keywordScore: z.number().min(0).max(100),
  careerTwinScore: z.number().min(0).max(100),
});

export const matchResultSchema = z.object({
  scores: matchScoreBreakdownSchema,
  strongMatches: z.array(matchResultItemSchema),
  partialMatches: z.array(matchResultItemSchema),
  missingRequirements: z.array(matchResultItemSchema),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  keywordCoverage: z.object({
    total: z.number(),
    matched: z.number(),
    percentage: z.number(),
    matchedKeywords: z.array(z.string()),
    missingKeywords: z.array(z.string()),
  }),
  recommendations: z.array(z.string()),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobDna = z.infer<typeof jobDnaSchema>;
export type MatchResult = z.infer<typeof matchResultSchema>;
