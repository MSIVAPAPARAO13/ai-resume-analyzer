import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env from current directory or root
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  // JWT
  JWT_ACCESS_SECRET: z.string().default('dev-access-secret-change-in-prod'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-change-in-prod'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  // External Providers (Phase 5)
  GEMINI_API_KEY: z.string().optional(),
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_APP_KEY: z.string().optional(),
  RUN_EXTERNAL_AI_TESTS: z.string().optional(),
  RUN_EXTERNAL_PROVIDER_TESTS: z.string().optional(),
  // GitHub & Token Encryption (Phase 6)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z
    .string()
    .default('http://localhost:4000/api/v1/github/callback'),
  GITHUB_ENCRYPTION_KEY: z.string().default('resumind-secret-key-32bytes-aes!'), // 32-character key for AES-256-GCM
  // Google Calendar & OAuth (Phase 7)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALENDAR_REDIRECT_URI: z
    .string()
    .default('http://localhost:4000/api/v1/calendar/callback'),
  // Resend Email (Phase 7)
  RESEND_API_KEY: z.string().optional(),
  // OpenRouter Fallback
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

// In production, reject default development secrets
if (parsedEnv.data.NODE_ENV === 'production') {
  if (parsedEnv.data.JWT_ACCESS_SECRET === 'dev-access-secret-change-in-prod') {
    console.error(
      '❌ FATAL: JWT_ACCESS_SECRET must be configured with a secure random key in production!',
    );
    process.exit(1);
  }
  if (
    parsedEnv.data.JWT_REFRESH_SECRET === 'dev-refresh-secret-change-in-prod'
  ) {
    console.error(
      '❌ FATAL: JWT_REFRESH_SECRET must be configured with a secure random key in production!',
    );
    process.exit(1);
  }
}

export const env = parsedEnv.data;
