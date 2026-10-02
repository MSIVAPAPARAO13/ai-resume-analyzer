import type { ParsedResumeData } from '../parser/section.parser.js';

export interface AIAnalysisResult {
  summaryCritique?: string;
  suggestedRoles?: string[];
  keyHighlights?: string[];
  recommendedKeywords?: string[];
}

export interface AIProvider {
  analyzeResume(
    text: string,
    parsedData: ParsedResumeData,
    careerTwin?: any,
  ): Promise<AIAnalysisResult>;
}
