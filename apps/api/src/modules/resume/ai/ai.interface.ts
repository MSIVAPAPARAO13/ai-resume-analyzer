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

// ==========================================
// Phase 7: Interview Intelligence Schemas
// ==========================================

export const InterviewDifficultySchema = z.enum(['EASY', 'MEDIUM', 'HARD']);
export type InterviewDifficulty = z.infer<typeof InterviewDifficultySchema>;

export const InterviewQuestionCategorySchema = z.enum([
  'RESUME',
  'CAREER_TWIN',
  'PROJECT',
  'TECHNICAL',
  'JOB_SPECIFIC',
  'BEHAVIORAL',
  'SITUATIONAL',
  'COMPANY_ROLE',
  'EXPERIENCE',
]);
export type InterviewQuestionCategory = z.infer<
  typeof InterviewQuestionCategorySchema
>;

export const EvidenceSourceTypeSchema = z.enum([
  'VERIFIED_USER_DATA',
  'RESUME',
  'CAREER_TWIN',
  'GITHUB',
  'JOB_DESCRIPTION',
  'NEEDS_REVIEW',
  'UNSUPPORTED',
]);
export type EvidenceSourceType = z.infer<typeof EvidenceSourceTypeSchema>;

export const EvidenceReferenceSchema = z.object({
  source: EvidenceSourceTypeSchema,
  type: z.string(), // e.g. "PROJECT", "SKILL", "EXPERIENCE", "REQUIREMENT"
  referenceId: z.string().optional(),
  label: z.string(),
  quote: z.string().optional(),
});
export type EvidenceReference = z.infer<typeof EvidenceReferenceSchema>;

export const InterviewGeneratedQuestionSchema = z.object({
  category: InterviewQuestionCategorySchema,
  difficulty: InterviewDifficultySchema,
  question: z.string(),
  whyAsked: z.string(),
  expectedSignals: z.array(z.string()).default([]),
  evidenceReferences: z.array(EvidenceReferenceSchema).default([]),
  preparationTips: z.array(z.string()).default([]),
});
export type InterviewGeneratedQuestion = z.infer<
  typeof InterviewGeneratedQuestionSchema
>;

export const InterviewQuestionGenerationResultSchema = z.object({
  questions: z.array(InterviewGeneratedQuestionSchema),
  overallTheme: z.string().optional(),
  focusAreas: z.array(z.string()).default([]),
});
export type InterviewQuestionGenerationResult = z.infer<
  typeof InterviewQuestionGenerationResultSchema
>;

export const InterviewAnswerEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  missingPoints: z.array(z.string()).default([]),
  improvementSuggestions: z.array(z.string()).default([]),
  recommendedStructure: z.string().optional(), // e.g. STAR structure advice
  evidenceAlignment: z.string().optional(),
  dimensions: z
    .object({
      relevance: z.number().min(0).max(100).default(70),
      completeness: z.number().min(0).max(100).default(70),
      clarity: z.number().min(0).max(100).default(70),
      technicalDepth: z.number().min(0).max(100).default(70),
      evidenceAlignmentScore: z.number().min(0).max(100).default(70),
    })
    .optional(),
});
export type InterviewAnswerEvaluation = z.infer<
  typeof InterviewAnswerEvaluationSchema
>;

export const TechnicalPrepItemSchema = z.object({
  skill: z.string(),
  classification: z.enum(['STRONG', 'REVIEW', 'GAP']),
  jobRequirement: z.string(),
  candidateEvidence: z.string(),
  recommendedTopics: z.array(z.string()).default([]),
});
export type TechnicalPrepItem = z.infer<typeof TechnicalPrepItemSchema>;

export const PreparationDayPlanSchema = z.object({
  day: z.number(),
  title: z.string(),
  focus: z.string(),
  tasks: z.array(z.string()).default([]),
  targetCategories: z.array(InterviewQuestionCategorySchema).default([]),
});
export type PreparationDayPlan = z.infer<typeof PreparationDayPlanSchema>;

export const InterviewPreparationPlanSchema = z.object({
  durationDays: z.number().default(5),
  dailyPlans: z.array(PreparationDayPlanSchema),
  technicalChecklist: z.array(TechnicalPrepItemSchema).default([]),
  keyStrategyNotes: z.array(z.string()).default([]),
});
export type InterviewPreparationPlan = z.infer<
  typeof InterviewPreparationPlanSchema
>;

export const InterviewFinalReportSchema = z.object({
  overallPreparationScore: z.number().min(0).max(100),
  technicalReadiness: z.number().min(0).max(100),
  behavioralReadiness: z.number().min(0).max(100),
  resumeReadiness: z.number().min(0).max(100),
  jobSpecificReadiness: z.number().min(0).max(100),
  projectReadiness: z.number().min(0).max(100),
  strongestAreas: z.array(z.string()).default([]),
  weakestAreas: z.array(z.string()).default([]),
  evidenceGaps: z.array(z.string()).default([]),
  recommendedTopics: z.array(z.string()).default([]),
  questionsToRevisit: z.array(z.string()).default([]),
  summaryFeedback: z.string(),
});
export type InterviewFinalReport = z.infer<typeof InterviewFinalReportSchema>;

export interface GenerateInterviewQuestionsParams {
  role: string;
  company?: string | null;
  mode: 'PREPARATION' | 'MOCK_INTERVIEW';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionCount?: number;
  careerTwin?: any;
  resumeData?: ParsedResumeData | null;
  jobDna?: {
    role: string;
    level?: string | null;
    skills: { name: string; importance: string }[];
    responsibilities: string[];
    keywords: string[];
  } | null;
  matchData?: {
    overallScore?: number;
    strongSkills?: string[];
    partialSkills?: string[];
    missingSkills?: string[];
  } | null;
  tailoringProvenance?: any;
  evidenceGuardClaims?: {
    verified: string[];
    external: string[];
    needsReview: string[];
  } | null;
}

export interface EvaluateAnswerParams {
  question: string;
  category: string;
  difficulty: string;
  expectedSignals?: string[];
  whyAsked?: string;
  answerText: string;
  candidateEvidenceSummary?: string;
}

export interface GeneratePrepPlanParams {
  role: string;
  company?: string | null;
  durationDays?: number;
  jobDna?: any;
  matchData?: any;
  careerTwin?: any;
  resumeData?: ParsedResumeData | null;
}

export interface GenerateFinalReportParams {
  sessionTitle: string;
  role: string;
  company?: string | null;
  questionsWithAnswers: Array<{
    question: string;
    category: string;
    difficulty: string;
    answerText: string;
    score?: number | null;
    strengths?: string[];
    weaknesses?: string[];
    missingPoints?: string[];
  }>;
}

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
  generateInterviewQuestions(
    params: GenerateInterviewQuestionsParams,
  ): Promise<InterviewQuestionGenerationResult>;
  evaluateInterviewAnswer(
    params: EvaluateAnswerParams,
  ): Promise<InterviewAnswerEvaluation>;
  generateInterviewPreparationPlan(
    params: GeneratePrepPlanParams,
  ): Promise<InterviewPreparationPlan>;
  generateInterviewFinalReport(
    params: GenerateFinalReportParams,
  ): Promise<InterviewFinalReport>;
}
