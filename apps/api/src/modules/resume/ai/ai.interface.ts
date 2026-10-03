import { z } from 'zod';
import type { ParsedResumeData } from '../parser/section.parser.js';

export const TailoringSuggestionTypeSchema = z.enum([
  'REWRITE',
  'REORDER',
  'ADD_EVIDENCE',
  'REMOVE_REDUNDANCY',
  'KEYWORD_ALIGNMENT',
  'SUMMARY_UPDATE',
  'PROJECT_EMPHASIS',
]);

export type TailoringSuggestionType = z.infer<
  typeof TailoringSuggestionTypeSchema
>;

export const TailoringSuggestionSchema = z.object({
  type: TailoringSuggestionTypeSchema,
  original: z.string(),
  proposed: z.string(),
  reason: z.string(),
  evidenceReferences: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(1.0),
  requiresUserApproval: z.boolean().default(true),
});

export type TailoringSuggestion = z.infer<typeof TailoringSuggestionSchema>;

export const EvidenceAnalysisSchema = z.object({
  supportedClaims: z.array(z.string()).default([]),
  unsupportedClaims: z.array(z.string()).default([]),
  uncertainClaims: z.array(z.string()).default([]),
  evidenceReferences: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});

export type EvidenceAnalysis = z.infer<typeof EvidenceAnalysisSchema>;

export const TailoringGenerationResultSchema = z.object({
  tailoredSummary: z.string().optional(),
  prioritizedSkills: z.array(z.string()).default([]),
  suggestions: z.array(TailoringSuggestionSchema).default([]),
  evidenceAnalysis: EvidenceAnalysisSchema.optional(),
});

export type TailoringGenerationResult = z.infer<
  typeof TailoringGenerationResultSchema
>;

export interface AIAnalysisResult {
  summaryCritique?: string;
  suggestedRoles?: string[];
  keyHighlights?: string[];
  recommendedKeywords?: string[];
}

export interface TailoringPromptParams {
  resumeText: string;
  parsedResume: ParsedResumeData;
  careerTwin?: any;
  jobDna: {
    role: string;
    level?: string | null;
    skills: { name: string; importance: string }[];
    responsibilities: string[];
    keywords: string[];
    experienceRequirement?: string | null;
    educationRequirement?: string | null;
  };
  jobDescription: string;
}

export interface AIProvider {
  readonly name: string;
  analyzeResume(
    text: string,
    parsedData: ParsedResumeData,
    careerTwin?: any,
  ): Promise<AIAnalysisResult>;
  generateTailoringSuggestions(
    params: TailoringPromptParams,
  ): Promise<TailoringGenerationResult>;
}
