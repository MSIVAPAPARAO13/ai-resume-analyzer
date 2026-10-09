import { env } from '../../../config/env.js';
import { AppError } from '../../../middleware/error-handler.js';
import { CreateJobInput } from '../job.validation.js';
import {
  JobProvider,
  JobSearchQuery,
  JobSearchResponse,
  JobSearchResult,
  RawJobPayload,
  SalaryEstimateResult,
} from './job-provider.interface.js';

export class AdzunaProvider implements JobProvider {
  name = 'ADZUNA';
  private baseUrl = 'https://api.adzuna.com/v1/api/jobs';

  private getCredentials() {
    const appId = process.env.ADZUNA_APP_ID || env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY || env.ADZUNA_APP_KEY;

    if (!appId || !appKey) {
      throw new AppError(
        'Adzuna Job Discovery is not configured. ADZUNA_APP_ID and ADZUNA_APP_KEY are required.',
        503,
      );
    }

    return { appId, appKey };
  }

  async fetchJob(input: CreateJobInput): Promise<RawJobPayload> {
    return {
      title: input.title.trim(),
      company: input.company.trim(),
      location: input.location?.trim() || null,
      employmentType: input.employmentType?.trim() || null,
      source: 'ADZUNA',
      sourceUrl: input.sourceUrl?.trim() || null,
      description: input.description.trim(),
    };
  }

  async searchJobs(query: JobSearchQuery): Promise<JobSearchResponse> {
    const { appId, appKey } = this.getCredentials();
    const country = (query.country || 'in').toLowerCase();
    const page = Math.max(1, query.page || 1);
    const resultsPerPage = Math.min(
      50,
      Math.max(1, query.resultsPerPage || 10),
    );

    const url = new URL(`${this.baseUrl}/${country}/search/${page}`);
    url.searchParams.set('app_id', appId);
    url.searchParams.set('app_key', appKey);
    url.searchParams.set('results_per_page', String(resultsPerPage));
    url.searchParams.set('content-type', 'application/json');

    if (query.q) url.searchParams.set('what', query.q);
    if (query.location) url.searchParams.set('where', query.location);
    if (query.category) url.searchParams.set('category', query.category);
    if (query.salaryMin)
      url.searchParams.set('salary_min', String(query.salaryMin));
    if (query.fullTime) url.searchParams.set('full_time', '1');
    if (query.permanent) url.searchParams.set('permanent', '1');

    try {
      // 15-second timeout to prevent Adzuna outages from hanging the API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15_000);

      let response: Response;
      try {
        response = await fetch(url.toString(), {
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new AppError(
            'Adzuna authentication failed. Please verify credentials.',
            502,
          );
        }
        if (response.status === 429) {
          throw new AppError(
            'Adzuna rate limit reached. Please try again in a few minutes.',
            429,
          );
        }
        throw new AppError(
          `Adzuna API returned error: HTTP ${response.status}`,
          502,
        );
      }

      const data: any = await response.json();
      const rawResults = Array.isArray(data.results) ? data.results : [];

      const normalizedResults: JobSearchResult[] = rawResults.map((raw: any) =>
        this.normalizeResult(raw, country),
      );

      return {
        results: normalizedResults,
        total:
          typeof data.count === 'number'
            ? data.count
            : normalizedResults.length,
        page,
        resultsPerPage,
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (err.name === 'AbortError') {
        throw new AppError(
          'Adzuna API request timed out. Please try again.',
          504,
        );
      }
      throw new AppError(
        `Adzuna search failed: ${err.message || 'Network error'}`,
        502,
      );
    }
  }

  async getSalaryEstimate(
    title: string,
    location?: string,
    country: string = 'in',
  ): Promise<SalaryEstimateResult> {
    const { appId, appKey } = this.getCredentials();
    const url = new URL(`${this.baseUrl}/${country.toLowerCase()}/history`);
    url.searchParams.set('app_id', appId);
    url.searchParams.set('app_key', appKey);
    url.searchParams.set('what', title);
    if (location) url.searchParams.set('where', location);
    url.searchParams.set('content-type', 'application/json');

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        return {
          predictedSalary: 0,
          currency: country === 'in' ? 'INR' : 'USD',
        };
      }
      const data: any = await response.json();
      const months = Object.keys(data.month || {});
      const latestMonth = months.sort().pop();
      const predicted = latestMonth ? data.month[latestMonth] : 0;

      return {
        predictedSalary: Math.round(predicted),
        currency: country === 'in' ? 'INR' : 'USD',
      };
    } catch {
      return {
        predictedSalary: 0,
        currency: country === 'in' ? 'INR' : 'USD',
      };
    }
  }

  private normalizeResult(raw: any, country: string): JobSearchResult {
    const stripHtml = (html: string = '') =>
      html.replace(/<\/?[^>]+(>|$)/g, '').trim();

    const title = stripHtml(raw.title || 'Untitled Role');
    const company = stripHtml(
      raw.company?.display_name || 'Confidential Employer',
    );
    const location = stripHtml(
      raw.location?.display_name || 'Location Not Specified',
    );
    const description = stripHtml(
      raw.description || 'No description provided.',
    );

    let salaryStr = 'Not disclosed';
    const currencySymbol =
      country === 'in' ? '₹' : country === 'gb' ? '£' : '$';

    if (raw.salary_min && raw.salary_max && raw.salary_min !== raw.salary_max) {
      salaryStr = `${currencySymbol}${Math.round(raw.salary_min).toLocaleString()} - ${currencySymbol}${Math.round(raw.salary_max).toLocaleString()}`;
    } else if (raw.salary_min) {
      salaryStr = `From ${currencySymbol}${Math.round(raw.salary_min).toLocaleString()}`;
    } else if (raw.salary_max) {
      salaryStr = `Up to ${currencySymbol}${Math.round(raw.salary_max).toLocaleString()}`;
    }

    return {
      id: raw.id
        ? `adzuna-${raw.id}`
        : `adzuna-${Math.random().toString(36).substring(2, 9)}`,
      title,
      company,
      location,
      description,
      salary: salaryStr,
      source: 'ADZUNA',
      sourceUrl: raw.redirect_url || '',
      postedAt: raw.created || new Date().toISOString(),
    };
  }
}

export const adzunaProvider = new AdzunaProvider();
