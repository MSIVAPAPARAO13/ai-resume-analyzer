import type { Request, Response, NextFunction } from 'express';
import { interviewService } from './interview.service.js';
import {
  createInterviewSessionSchema,
  updateInterviewSessionSchema,
  generateQuestionsSchema,
  submitAnswerSchema,
  scheduleCalendarEventSchema,
} from './interview.validation.js';
import { AppError } from '../../middleware/error-handler.js';

function getUserId(req: Request): string {
  const user = (req as any).user;
  const userId = user?.userId || user?.id;
  if (!userId) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  return userId;
}

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

export class InterviewController {
  async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const parsed = createInterviewSessionSchema.parse(req.body);
      const session = await interviewService.createInterview(
        userId,
        parsed as any,
      );
      return res.status(201).json({
        success: true,
        data: session,
      });
    } catch (err) {
      next(err);
    }
  }

  async listSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const sessions = await interviewService.listInterviews(userId);
      return res.json({
        success: true,
        data: sessions,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const session = await interviewService.getInterview(userId, id);
      return res.json({
        success: true,
        data: session,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const parsed = updateInterviewSessionSchema.parse(req.body);
      const updated = await interviewService.updateInterview(
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

  async deleteSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const result = await interviewService.deleteInterview(userId, id);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async generateQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const parsed = generateQuestionsSchema.parse(req.body);
      const result = await interviewService.generateQuestions(
        userId,
        id,
        parsed,
      );
      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async listQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const questions = await interviewService.listQuestions(userId, id);
      return res.json({
        success: true,
        data: questions,
      });
    } catch (err) {
      next(err);
    }
  }

  async submitAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const questionId = getParam(req.params.questionId);
      const parsed = submitAnswerSchema.parse(req.body);
      const answer = await interviewService.submitAnswer(
        userId,
        id,
        questionId,
        parsed,
      );
      return res.status(201).json({
        success: true,
        data: answer,
      });
    } catch (err) {
      next(err);
    }
  }

  async listAnswers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const questionId = getParam(req.params.questionId);
      const answers = await interviewService.listAnswers(
        userId,
        id,
        questionId,
      );
      return res.json({
        success: true,
        data: answers,
      });
    } catch (err) {
      next(err);
    }
  }

  async evaluateAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const questionId = getParam(req.params.questionId);
      const { answerId } = req.body || {};
      const result = await interviewService.evaluateAnswer(
        userId,
        id,
        questionId,
        answerId,
      );
      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getPrepPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const plan = await interviewService.getPreparationPlan(userId, id);
      return res.json({
        success: true,
        data: plan,
      });
    } catch (err) {
      next(err);
    }
  }

  async completeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const completed = await interviewService.completeSession(userId, id);
      return res.json({
        success: true,
        data: completed,
      });
    } catch (err) {
      next(err);
    }
  }

  async getFinalReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const report = await interviewService.getFinalReport(userId, id);
      return res.json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  async addCalendarEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = getParam(req.params.id);
      const parsed = scheduleCalendarEventSchema.parse(req.body);
      const result = await interviewService.scheduleCalendarEvent(
        userId,
        id,
        parsed,
      );
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const interviewController = new InterviewController();
