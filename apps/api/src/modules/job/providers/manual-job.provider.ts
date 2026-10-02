import { CreateJobInput } from '../job.validation.js';
import { JobProvider, RawJobPayload } from './job-provider.interface.js';

export class ManualJobProvider implements JobProvider {
  name = 'MANUAL';

  async fetchJob(input: CreateJobInput): Promise<RawJobPayload> {
    return {
      title: input.title.trim(),
      company: input.company.trim(),
      location: input.location?.trim() || null,
      employmentType: input.employmentType?.trim() || null,
      source: 'MANUAL',
      sourceUrl: input.sourceUrl?.trim() || null,
      description: input.description.trim(),
    };
  }
}
