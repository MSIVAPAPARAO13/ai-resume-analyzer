import { Request, Response, NextFunction } from 'express';
import { adzunaProvider } from './providers/adzuna.provider.js';
import { JobService } from './job.service.js';
import { AppError } from '../../middleware/error-handler.js';

const jobService = new JobService();

function getUserId(req: Request): string {
  const user = (req as any).user;
  const id = user?.userId || user?.id;
  if (!id) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  return id;
}

export class JobSearchController {
  async searchJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query.q ? String(req.query.q).trim() : undefined;
      const location = req.query.location
        ? String(req.query.location).trim()
        : undefined;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const resultsPerPage = req.query.resultsPerPage
        ? parseInt(String(req.query.resultsPerPage), 10)
        : 10;
      const category = req.query.category
        ? String(req.query.category).trim()
        : undefined;
      const salaryMin = req.query.salaryMin
        ? parseInt(String(req.query.salaryMin), 10)
        : undefined;
      const fullTime =
        req.query.fullTime === 'true' || req.query.fullTime === '1';
      const permanent =
        req.query.permanent === 'true' || req.query.permanent === '1';
      const country = req.query.country
        ? String(req.query.country).trim()
        : 'in';

      const results = await adzunaProvider.searchJobs({
        q,
        location,
        page,
        resultsPerPage,
        category,
        salaryMin,
        fullTime,
        permanent,
        country,
      });

      return res.status(200).json({
        success: true,
        data: results,
      });
    } catch (err) {
      next(err);
    }
  }

  async importJob(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const {
        title,
        company,
        location,
        description,
        sourceUrl,
        employmentType,
      } = req.body;

      if (!title || !company || !description) {
        throw new AppError(
          'Title, company, and description are required to import a job.',
          400,
        );
      }

      const result = await jobService.importJob(userId, {
        title,
        company,
        location,
        description,
        sourceUrl,
        employmentType,
        source: 'ADZUNA',
      });

      return res.status(201).json({
        success: true,
        data: result.job,
        alreadyImported: result.alreadyImported,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSalaryEstimate(req: Request, res: Response, next: NextFunction) {
    try {
      const title = req.query.title ? String(req.query.title).trim() : '';
      const location = req.query.location
        ? String(req.query.location).trim()
        : undefined;
      const country = req.query.country
        ? String(req.query.country).trim()
        : 'in';

      if (!title) {
        throw new AppError('Job title is required to estimate salary.', 400);
      }

      const estimate = await adzunaProvider.getSalaryEstimate(
        title,
        location,
        country,
      );

      return res.status(200).json({
        success: true,
        data: estimate,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const jobSearchController = new JobSearchController();
