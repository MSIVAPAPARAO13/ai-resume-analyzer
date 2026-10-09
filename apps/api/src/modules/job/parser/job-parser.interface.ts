import { JobDna } from '../job.validation.js';

export interface JobDescriptionParser {
  parse(title: string, description: string): Promise<JobDna>;
}
