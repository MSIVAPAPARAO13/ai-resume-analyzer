import { env } from '../../config/env.js';

export class HealthService {
  public getHealthData() {
    return {
      status: 'ok',
      version: 'v1',
      environment: env.NODE_ENV,
    };
  }
}

export const healthService = new HealthService();
