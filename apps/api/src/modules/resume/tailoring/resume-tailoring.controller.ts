import { Request, Response, NextFunction } from 'express';
import { resumeTailoringService } from './resume-tailoring.service.js';
import { AppError } from '../../../middleware/error-handler.js';

function getUserId(req: Request): string {
  const user = (req as any).user;
  const id = user?.userId || user?.id;
  if (!id) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  return id;
}

export class ResumeTailoringController {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const resumeId = req.params.resumeId as string;
      const jobId = req.params.jobId as string;
      const { forceRefresh, provider } = req.body || {};
      const userId = getUserId(req);

      const result = await resumeTailoringService.generateTailoringSession(
        userId,
        resumeId,
        jobId,
        { forceRefresh, provider },
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.params.sessionId as string;
      const userId = getUserId(req);

      const session = await resumeTailoringService.getSession(
        userId,
        sessionId,
      );

      return res.status(200).json({
        success: true,
        data: session,
      });
    } catch (err) {
      next(err);
    }
  }

  async acceptSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.params.sessionId as string;
      const suggestionId = req.params.suggestionId as string;
      const userId = getUserId(req);

      const updated = await resumeTailoringService.acceptSuggestion(
        userId,
        sessionId,
        suggestionId,
      );

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async rejectSuggestion(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.params.sessionId as string;
      const suggestionId = req.params.suggestionId as string;
      const userId = getUserId(req);

      const updated = await resumeTailoringService.rejectSuggestion(
        userId,
        sessionId,
        suggestionId,
      );

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async completeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.params.sessionId as string;
      const userId = getUserId(req);

      const result = await resumeTailoringService.completeSession(
        userId,
        sessionId,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const resumeTailoringController = new ResumeTailoringController();
