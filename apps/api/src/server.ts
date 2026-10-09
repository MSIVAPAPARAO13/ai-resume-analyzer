import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './config/database.js';
import { getRedisClient } from './config/redis.js';

const PORT = env.PORT || 4000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Resumind API server running on http://localhost:${PORT}`);
  logger.info(
    `📋 Health check available at http://localhost:${PORT}/api/v1/health`,
  );
});

// Graceful Shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await prisma.$disconnect();
      logger.info('Prisma database client disconnected.');
    } catch (err) {
      logger.error({ err }, 'Error disconnecting Prisma client');
    }

    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.quit();
        logger.info('Redis client connection closed.');
      }
    } catch (err) {
      logger.error({ err }, 'Error closing Redis connection');
    }

    logger.info('Graceful shutdown completed.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forcefully terminating process due to shutdown timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
