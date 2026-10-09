import { CreateJobInput } from '../job.validation.js';

export interface RawJobPayload {
  title: string;
  company: string;
  location?: string | null;
  employmentType?: string | null;
  source: string;
  sourceUrl?: string | null;
  description: string;
}

export interface JobSearchQuery {
  q?: string;
  location?: string;
  page?: number;
  resultsPerPage?: number;
  category?: string;
  salaryMin?: number;
  fullTime?: boolean;
  permanent?: boolean;
  country?: string;
}

export interface JobSearchResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string;
  source: string;
  sourceUrl: string;
  postedAt: string;
}

export interface JobSearchResponse {
  results: JobSearchResult[];
  total: number;
  page: number;
  resultsPerPage: number;
}

export interface SalaryEstimateResult {
  predictedSalary: number;
  currency: string;
  salaryMin?: number;
  salaryMax?: number;
}

export interface JobProvider {
  name: string;
  fetchJob(input: CreateJobInput): Promise<RawJobPayload>;
  searchJobs?(query: JobSearchQuery): Promise<JobSearchResponse>;
  getSalaryEstimate?(
    title: string,
    location?: string,
  ): Promise<SalaryEstimateResult>;
}
