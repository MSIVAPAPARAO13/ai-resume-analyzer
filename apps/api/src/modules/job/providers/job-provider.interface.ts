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

export interface JobProvider {
  name: string;
  fetchJob(input: CreateJobInput): Promise<RawJobPayload>;
}
