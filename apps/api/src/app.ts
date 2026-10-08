import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { healthRouter } from './modules/health/health.router.js';
import { authRouter } from './modules/auth/auth.router.js';
import { careerRouter } from './modules/career/career.router.js';
import { resumeRouter } from './modules/resume/resume.router.js';
import { jobRouter } from './modules/job/job.router.js';
import { jobSearchRouter } from './modules/job/job-search.router.js';
import { applicationRouter } from './modules/application/application.router.js';
import { githubRouter } from './modules/github/github.router.js';
import { interviewRouter } from './modules/interview/interview.router.js';
import { calendarRouter } from './modules/calendar/calendar.router.js';
import { analyticsRouter } from './modules/analytics/analytics.router.js';
import {
  learningRouter,
  learningEntityRouter,
} from './modules/learning/learning.router.js';
import { logger } from './utils/logger.js';

export function createApp(): express.Application {
  const app = express();

  // ─── Security Headers ────────────────────────────────────────────────────────
  // Hardened Helmet configuration with CSP compatible with Bootstrap + Vite
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for Bootstrap inline scripts & React
            'https://cdn.jsdelivr.net',
            'https://js.puter.com',
            'https://fonts.googleapis.com',
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Required for Bootstrap inline styles
            'https://fonts.googleapis.com',
            'https://cdn.jsdelivr.net',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          connectSrc: [
            "'self'",
            env.FRONTEND_URL,
            env.CORS_ORIGIN,
            'https://fonts.googleapis.com',
          ],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
        },
      },
      // X-Frame-Options: DENY — prevent clickjacking
      frameguard: { action: 'deny' },
      // X-Content-Type-Options: nosniff
      noSniff: true,
      // Referrer-Policy: strict-origin-when-cross-origin
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // HSTS — only add in production (HTTPS); during dev it breaks localhost
      strictTransportSecurity:
        env.NODE_ENV === 'production'
          ? { maxAge: 31536000, includeSubDomains: true, preload: true }
          : false,
      // Permissions-Policy to restrict dangerous browser features
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Allow OAuth popups
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Permissions-Policy header (not directly in Helmet 8 — add manually)
  app.use((_req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    );
    next();
  });

  // ─── CORS ────────────────────────────────────────────────────────────────────
  // Production MUST use explicit origin, not '*'.
  // In dev/test we allow the configured CORS_ORIGIN or localhost fallback.
  const allowedOrigins = env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173'];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow server-to-server (no origin) requests only in non-production
        if (!origin) {
          if (env.NODE_ENV !== 'production') return callback(null, true);
          return callback(new Error('Origin required in production'), false);
        }
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      credentials: true,
    }),
  );

  // ─── Request Correlation ID ──────────────────────────────────────────────────
  app.use(requestIdMiddleware);

  // ─── Structured Request Logging ─────────────────────────────────────────────
  // Skip in test mode to keep output clean
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        genReqId: (req) => (req.headers['x-request-id'] as string) || req.id,
        // Redact sensitive fields from logs
        redact: [
          'req.headers.authorization',
          'req.body.password',
          'req.body.refreshToken',
        ],
      }),
    );
  }

  // ─── Body Parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── Rate Limiting ───────────────────────────────────────────────────────────

  // Auth endpoints: strict 20 req / 15 min
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
  });

  // Job search & external requests: 60 req / 15 min
  const jobSearchLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many search requests, please try again later',
      },
    },
  });

  // General API: 300 req / 15 min (generous for normal use)
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please slow down',
      },
    },
  });

  // Apply general rate limit to all API routes
  app.use('/api/v1', generalLimiter);

  // ─── API v1 Routes ───────────────────────────────────────────────────────────
  app.use('/api/v1', healthRouter);
  app.use('/api/v1/auth', authLimiter, authRouter);
  app.use('/api/v1/calendar', calendarRouter);
  app.use('/api/v1/github', githubRouter);
  app.use('/api/v1/interviews', interviewRouter);
  app.use('/api/v1/applications', applicationRouter);
  app.use('/api/v1/jobs', jobRouter);
  app.use('/api/v1/job-search', jobSearchLimiter);
  app.use('/api/v1', jobSearchRouter);
  app.use('/api/v1/analytics', analyticsRouter);
  app.use('/api/v1/learning-plans', learningRouter);
  app.use('/api/v1', learningEntityRouter);
  app.use('/api/v1', careerRouter);
  app.use('/api/v1', resumeRouter);

  // ─── Error Handlers ──────────────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
