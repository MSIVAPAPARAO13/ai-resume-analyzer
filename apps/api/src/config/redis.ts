import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis retry attempts exceeded; backing off');
          return null;
        }
        return Math.min(times * 100, 2000);
      },
    });

    redisClient.on('error', (err) => {
      logger.warn({ err: err.message }, 'Redis client error');
    });
  }

  return redisClient;
}

export async function checkRedisHealth(): Promise<
  'connected' | 'disconnected'
> {
  const client = getRedisClient();
  if (!client) {
    return 'disconnected';
  }

  try {
    if (client.status !== 'ready') {
      await client.connect();
    }
    const pong = await client.ping();
    return pong === 'PONG' ? 'connected' : 'disconnected';
  } catch (error) {
    logger.warn({ err: error }, 'Redis health check failed');
    return 'disconnected';
  }
}
