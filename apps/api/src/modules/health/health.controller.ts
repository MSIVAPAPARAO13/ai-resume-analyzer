import type { Request, Response } from 'express';
import { healthService } from './health.service.js';

export class HealthController {
  public getHealth(req: Request, res: Response): void {
    const data = healthService.getHealthData();
    res.status(200).json({
      success: true,
      data,
    });
  }
}

export const healthController = new HealthController();
