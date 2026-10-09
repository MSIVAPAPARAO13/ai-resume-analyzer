# Resumind — Production Deployment Readiness Report

**Specification Reference:** Phase 16 — Production Deployment Readiness  
**Target Infrastructure:** Cloud Container / Render Web Service + Managed PostgreSQL + Redis  
**Configuration Manifest:** `render.yaml`, `Dockerfile`, `apps/api/.env.example`  
**Status:** **READY FOR PRODUCTION DEPLOYMENT**

---

## 1. Build Verification & Bundles

Both workspace production builds have been validated and compile cleanly:

| Workspace | Build Command | Output | Status |
|---|---|---|---|
| `@resumind/web` | `npm run build:web` | `build/client/` (Assets, client bundles, SSR index.js) | **PASSED** (0 Errors) |
| `@resumind/api` | `npm run build:api` | `dist/` (Transpiled Express server & routers) | **PASSED** (0 Errors) |

---

## 2. Infrastructure & Environment Audit

### 2.1 Managed Services
- **Database**: PostgreSQL 16 with UUID generation (`gen_random_uuid()`).
  - Migration command: `npx prisma migrate deploy`
  - Client generator: `npx prisma generate`
- **Cache & Rate Limiting**: Redis 7 (via `ioredis` with automatic exponential backoff reconnection).
- **Blob & Resume Storage**: Local persistent disk mount `/var/data/uploads` in container or managed S3/Cloud Storage.

### 2.2 Security & Network Hardening
- **Helmet HTTP Security**: Strict CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy`.
- **CORS Allowlist**: Configured strictly to match production frontend URL (`CORS_ORIGIN`).
- **Tiered Rate Limiting**: 20 req / 15 min for auth endpoints; 60 req / 15 min for external job searches; 300 req / 15 min for general API.
- **Token Encryption**: Google Calendar and GitHub OAuth tokens encrypted using AES-256-GCM (`GITHUB_ENCRYPTION_KEY`).

---

## 3. Production Environment Variables Checklist

| Variable | Description | Classification |
|---|---|---|
| `NODE_ENV` | Must be set to `production` | Config |
| `PORT` | Service listening port (default `4000`) | Config |
| `FRONTEND_URL` | Public production web URL (e.g., `https://resumind.app`) | Config |
| `BACKEND_URL` | Public production API URL (e.g., `https://api.resumind.app`) | Config |
| `CORS_ORIGIN` | Allowed web origin matching `FRONTEND_URL` | Security |
| `DATABASE_URL` | Production PostgreSQL connection string | Secret |
| `REDIS_URL` | Production Redis connection string | Secret |
| `JWT_ACCESS_SECRET` | Cryptographically random secret (min 64 chars) | Secret |
| `JWT_REFRESH_SECRET` | Cryptographically random secret (min 64 chars) | Secret |
| `GITHUB_ENCRYPTION_KEY` | 32-byte hex key for OAuth token AES-256-GCM | Secret |
| `GEMINI_API_KEY` | Google Gemini AI API key | Secret |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth Client ID for Calendar | Provider |
| `GOOGLE_CLIENT_SECRET`| Google Cloud OAuth Client Secret | Secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | Provider |
| `GITHUB_CLIENT_SECRET`| GitHub OAuth App Client Secret | Secret |
| `ADZUNA_APP_ID` | Adzuna Job Search App ID | Provider |
| `ADZUNA_APP_KEY` | Adzuna Job Search App Key | Secret |

---

## 4. Rollback & Disaster Recovery Procedures
1. **Migration Rollback**: In case of a failing migration, deploy previous container image and apply specific rollback SQL script from `apps/api/prisma/migrations/`.
2. **Container Health Checks**: Render Blueprint validates `GET /api/v1/health` before routing traffic.
3. **Database Backups**: Managed PostgreSQL automated daily snapshots with point-in-time recovery (PITR).
