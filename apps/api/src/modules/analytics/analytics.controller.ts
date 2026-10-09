import type { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service.js';
import { AppError } from '../../middleware/error-handler.js';

function getUserId(req: Request): string {
  const user = (req as any).user;
  const userId = user?.userId || user?.id;
  if (!userId) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  return userId;
}

export class AnalyticsController {
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const data = await analyticsService.getOverview(userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getSkills(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const data = await analyticsService.gatherUserSkills(userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getSkillGaps(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const data = await analyticsService.getSkillGaps(userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getSkillDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const skill = String(req.params.skill);
      const data = await analyticsService.getSkillDetail(userId, skill);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const data = await analyticsService.getRoleAnalytics(userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const data = await analyticsService.getJobMarketSkillAnalytics(userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const data = await analyticsService.getApplicationAnalytics(userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getInterviews(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const data = await analyticsService.getInterviewAnalytics(userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getResumes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const data = await analyticsService.getResumePerformanceAnalytics(userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const data = await analyticsService.getEvidenceCoverage(userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const data = await analyticsService.getHistoricalProgress(userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createSnapshot(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const data = await analyticsService.createSnapshot(userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
