import type { Request, Response, NextFunction } from 'express';
import { learningService } from './learning.service.js';
import { AppError } from '../../middleware/error-handler.js';

function getUserId(req: Request): string {
  const user = (req as any).user;
  const userId = user?.userId || user?.id;
  if (!userId) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  return userId;
}

export class LearningController {
  async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const plan = await learningService.createPlan(userId, req.body);
      return res.status(201).json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  async listPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const plans = await learningService.listPlans(userId);
      return res.json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  }

  async getPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = String(req.params.id);
      const plan = await learningService.getPlan(userId, id);
      return res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = String(req.params.id);
      const plan = await learningService.updatePlan(userId, id, req.body);
      return res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  async deletePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = String(req.params.id);
      const result = await learningService.deletePlan(userId, id);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async generatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = String(req.params.id);
      const plan = await learningService.generatePlanFromGaps(userId, id);
      return res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  async getGoals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = String(req.params.id);
      const plan = await learningService.getPlan(userId, id);
      return res.json({ success: true, data: plan.goals });
    } catch (err) {
      next(err);
    }
  }

  async addGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = String(req.params.id);
      const goal = await learningService.addGoal(userId, id, req.body);
      return res.status(201).json({ success: true, data: goal });
    } catch (err) {
      next(err);
    }
  }

  async updateGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = String(req.params.id);
      const goal = await learningService.updateGoal(userId, id, req.body);
      return res.json({ success: true, data: goal });
    } catch (err) {
      next(err);
    }
  }

  async addTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const task = await learningService.addTask(userId, req.body);
      return res.status(201).json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = String(req.params.id);
      const task = await learningService.updateTask(userId, id, req.body);
      return res.json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = String(req.params.id);
      const result = await learningService.deleteTask(userId, id);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async completePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = String(req.params.id);
      const plan = await learningService.completePlan(userId, id);
      return res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }
}

export const learningController = new LearningController();
