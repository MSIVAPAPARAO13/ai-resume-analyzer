import { JobDna, MatchResult } from '../job.validation.js';

export interface CareerTwinContext {
  headline?: string | null;
  summary?: string | null;
  targetRole?: string | null;
  skills: Array<{
    name: string;
    category?: string | null;
    proficiency?: string | null;
  }>;
  experiences: Array<{
    title: string;
    company: string;
    startDate: Date;
    endDate?: Date | null;
    isCurrent: boolean;
    description?: string | null;
  }>;
  education: Array<{
    degree?: string | null;
    institution: string;
    fieldOfStudy?: string | null;
  }>;
  projects: Array<{
    name: string;
    description?: string | null;
    technologies: string[];
  }>;
}

export interface MatchingEngineInput {
  parsedResume: any; // ParsedResumeData
  extractedText: string;
  jobDna: JobDna;
  careerTwin?: CareerTwinContext | null;
}

export interface MatchingEngine {
  match(input: MatchingEngineInput): Promise<MatchResult>;
}
