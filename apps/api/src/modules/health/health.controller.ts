import type { Request, Response } from 'express';
import { healthService } from './health.service.js';

export class HealthController {
  /**
   * Full health check — returns service status summary.
   * Safe: never leaks connection strings.
   */
  public async getHealth(req: Request, res: Response): Promise<void> {
    const data = await healthService.getHealthData();
    res.status(200).json({
      success: true,
      data,
    });
  }

  /**
   * Readiness check — returns 200 only when all required services are ready.
   * Returns 503 if the database is unavailable.
   * Redis failure is non-fatal (optional caching).
   */
  public async getReadiness(req: Request, res: Response): Promise<void> {
    const data = await healthService.getHealthData();

    // Database is required; Redis is optional
    const isReady = data.services.database === 'connected';

    res.status(isReady ? 200 : 503).json({
      success: isReady,
      data: {
        status: isReady ? 'ready' : 'not_ready',
        services: data.services,
      },
    });
  }
}

export const healthController = new HealthController();
