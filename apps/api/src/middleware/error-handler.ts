import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void => {
  const requestId = req.headers['x-request-id'] as string;

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.errors,
      },
    });
    return;
  }

  const customStatusCode = (err as any).statusCode || (err as any).status;
  if (
    err instanceof AppError ||
    err.name === 'AppError' ||
    (typeof customStatusCode === 'number' &&
      customStatusCode >= 400 &&
      customStatusCode < 600)
  ) {
    const statusCode = customStatusCode || (err as any).statusCode || 500;
    const code =
      (err as any).code ||
      (statusCode === 404
        ? 'NOT_FOUND'
        : statusCode === 401
          ? 'UNAUTHORIZED'
          : statusCode === 403
            ? 'FORBIDDEN'
            : statusCode === 400
              ? 'BAD_REQUEST'
              : 'ERROR');
    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message: err.message,
        details: (err as any).details,
      },
    });
    return;
  }

  logger.error({ err, requestId }, 'Unhandled application error');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected internal error occurred'
          : err.message,
    },
  });
};
