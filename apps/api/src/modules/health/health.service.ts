import { env } from '../../config/env.js';
import { checkDatabaseHealth } from '../../config/database.js';
import { checkRedisHealth } from '../../config/redis.js';

export class HealthService {
  public async getHealthData() {
    const [database, redis] = await Promise.all([
      checkDatabaseHealth(),
      checkRedisHealth(),
    ]);

    return {
      status: 'ok',
      version: 'v1',
      environment: env.NODE_ENV,
      services: {
        database,
        redis,
      },
    };
  }
}

export const healthService = new HealthService();
