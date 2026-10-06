import type { Request, Response, NextFunction } from 'express';
import { applicationService } from './application.service.js';
import {
  createApplicationSchema,
  updateApplicationSchema,
  updateApplicationStatusSchema,
  createApplicationEventSchema,
} from './application.validation.js';
import { AppError } from '../../middleware/error-handler.js';

function getUserId(req: Request): string {
  const user = (req as any).user;
  const userId = user?.userId || user?.id;
  if (!userId) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  return userId;
}

export class ApplicationController {
  async createApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const parsed = createApplicationSchema.parse(req.body);
      const application = await applicationService.createApplication(
        userId,
        parsed as any,
      );
      return res.status(201).json({
        success: true,
        data: application,
      });
    } catch (err) {
      next(err);
    }
  }

  async getApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const { status, search, page, pageSize } = req.query;
      const applications = await applicationService.getApplications(userId, {
        status: status as any,
        search: typeof search === 'string' ? search : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      });
      return res.json({
        success: true,
        data: applications,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const analytics = await applicationService.getAnalytics(userId);
      return res.json({
        success: true,
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }

  async getApplicationById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;
      const application = await applicationService.getApplicationById(
        userId,
        id,
      );
      return res.json({
        success: true,
        data: application,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;
      const parsed = updateApplicationSchema.parse(req.body);
      const updated = await applicationService.updateApplication(
        userId,
        id,
        parsed as any,
      );
      return res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;
      await applicationService.deleteApplication(userId, id);
      return res.json({
        success: true,
        data: { message: 'Application deleted successfully' },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;
      const parsed = updateApplicationStatusSchema.parse(req.body);
      const updated = await applicationService.updateStatus(
        userId,
        id,
        parsed.status as any,
        parsed.notes,
        parsed.eventDate,
      );
      return res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;
      const events = await applicationService.getEvents(userId, id);
      return res.json({
        success: true,
        data: events,
      });
    } catch (err) {
      next(err);
    }
  }

  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;
      const parsed = createApplicationEventSchema.parse(req.body);
      const event = await applicationService.createEvent(
        userId,
        id,
        parsed as any,
      );
      return res.status(201).json({
        success: true,
        data: event,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const applicationController = new ApplicationController();
