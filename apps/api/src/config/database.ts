import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export async function checkDatabaseHealth(): Promise<
  'connected' | 'disconnected'
> {
  if (!process.env.DATABASE_URL) {
    return 'disconnected';
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch (error) {
    logger.warn({ err: error }, 'Database health check failed');
    return 'disconnected';
  }
}
