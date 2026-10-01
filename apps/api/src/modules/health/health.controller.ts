import type { Request, Response } from 'express';
import { healthService } from './health.service.js';

export class HealthController {
  public async getHealth(req: Request, res: Response): Promise<void> {
    const data = await healthService.getHealthData();
    res.status(200).json({
      success: true,
      data,
    });
  }
}

export const healthController = new HealthController();
