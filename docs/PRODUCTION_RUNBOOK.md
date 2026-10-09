# Resumind — Production Engineering Runbook

This runbook establishes standard operating procedures, architectural standards, incident management protocols, and disaster recovery workflows for the Resumind Production SaaS platform.

---

## 1. System Architecture Overview

Resumind is architected as a modular monolith adhering to a resilient cloud-native topology:

```
[Users / Browsers]
        │ HTTPS (TLS 1.3)
        ▼
[Cloud Edge / CDN / Load Balancer]
   ├───► [Resumind Web: React Router v7 SSR] (Port 3000/5173)
   └───► [Resumind API: Node.js Express 4] (Port 4000)
            ├───► [PostgreSQL 16 Managed DB] (Prisma ORM, SSL required)
            ├───► [Redis 7 Managed Cache] (TLS, LRU eviction, non-blocking fallback)
            ├───► [Storage Volume: /app/uploads] (Isolated resume files)
            └───► External Service Providers:
                    ├── Google Gemini 1.5 Pro / Flash (Evidence Guard & Tailoring)
                    ├── Adzuna API (Live Job Search)
                    ├── GitHub OAuth & REST API (Career Evidence)
                    ├── Google Cloud Calendar OAuth (Interview Scheduling)
                    └── Resend API (Transactional Notifications)
```

---

## 2. Infrastructure & Hosting Topology

| Component              | Target Provider                        | Runtime / Image                          | Access Model                               |
| :--------------------- | :------------------------------------- | :--------------------------------------- | :----------------------------------------- |
| **Frontend Web**       | Render / Railway / Vercel              | Node 20 (`react-router-serve`)           | Public HTTPS (`https://resumind.app`)      |
| **Backend API**        | Render / Railway                       | Node 20 (`node apps/api/dist/server.js`) | Public HTTPS (`https://api.resumind.app`)  |
| **Database**           | Render Postgres / Neon / AWS RDS       | PostgreSQL 16                            | Private internal VPC / SSL enforced        |
| **Cache & Throttling** | Render Redis / Upstash                 | Redis 7 (`allkeys-lru`)                  | Private internal VPC / TLS                 |
| **File Storage**       | Render Persistent Disk / Cloudflare R2 | 1GB Persistent Mount (`/app/uploads`)    | Private, authenticated backend stream only |

---

## 3. Environment Variables & Secret Configuration

Production secrets must **never** be checked into version control. Configure them securely via the hosting provider's encrypted environment variables console.

| Variable Name                  | Required | Purpose & Format                                                                             |
| :----------------------------- | :------: | :------------------------------------------------------------------------------------------- |
| `NODE_ENV`                     | **Yes**  | Set to `production`                                                                          |
| `PORT`                         | **Yes**  | Server listening port (default: `4000` or assigned by PaaS)                                  |
| `DATABASE_URL`                 | **Yes**  | Connection string with SSL: `postgresql://user:pass@host:5432/resumind_prod?sslmode=require` |
| `REDIS_URL`                    | Optional | Connection string with TLS: `rediss://default:pass@host:6379`                                |
| `FRONTEND_URL`                 | **Yes**  | Public frontend URL: `https://resumind.app`                                                  |
| `CORS_ORIGIN`                  | **Yes**  | Strict allowed origin: `https://resumind.app`                                                |
| `JWT_ACCESS_SECRET`            | **Yes**  | 256-bit cryptographically secure string (`openssl rand -base64 32`)                          |
| `JWT_REFRESH_SECRET`           | **Yes**  | 256-bit cryptographically secure string (`openssl rand -base64 32`)                          |
| `GITHUB_ENCRYPTION_KEY`        | **Yes**  | Exactly 32 characters for AES-256-GCM token encryption                                       |
| `GEMINI_API_KEY`               | **Yes**  | Google Cloud Gemini API key for Evidence Guard & Tailoring                                   |
| `GITHUB_CLIENT_ID`             | Optional | GitHub OAuth Application Client ID                                                           |
| `GITHUB_CLIENT_SECRET`         | Optional | GitHub OAuth Application Client Secret                                                       |
| `GITHUB_CALLBACK_URL`          | Optional | `https://api.resumind.app/api/v1/github/callback`                                            |
| `GOOGLE_CLIENT_ID`             | Optional | Google Cloud OAuth Client ID                                                                 |
| `GOOGLE_CLIENT_SECRET`         | Optional | Google Cloud OAuth Client Secret                                                             |
| `GOOGLE_CALENDAR_REDIRECT_URI` | Optional | `https://api.resumind.app/api/v1/calendar/callback`                                          |
| `ADZUNA_APP_ID`                | Optional | Adzuna Job API App ID                                                                        |
| `ADZUNA_APP_KEY`               | Optional | Adzuna Job API Secret Key                                                                    |
| `RESEND_API_KEY`               | Optional | Resend API key for transactional email                                                       |

---

## 4. Deployment Procedure

### Automated Deployment via CI/CD (Standard Flow)

1. Developers push changes to a feature branch (`feature/<name>`).
2. Open a Pull Request targeting `main`.
3. GitHub Actions triggers `.github/workflows/production-pipeline.yml`:
   - Runs `npm run typecheck`, `npm run lint`, `npm run format:check`.
   - Runs Prisma schema validation and Vitest suites (207+ tests).
   - Verifies production web and API builds.
4. On PR merge to `main`, production deployment webhooks trigger zero-downtime rolling deploys.

### Safe Database Migrations

Production deployments strictly execute:

```bash
npm run db:migrate:deploy
# Underlying command: npx prisma migrate deploy
```

> [!CAUTION]
> NEVER execute `prisma migrate reset` or `prisma db push` in production. Always apply verified forward-only migrations.

---

## 5. Health Checks & Verification

### Endpoints

- **Health Check**: `GET /api/v1/health`
  - Returns HTTP 200 with service status, timestamp, uptime, database connectivity, and Redis connectivity.
  - Responses include correlation header `X-Request-Id`.
- **Liveness**: Validated automatically by container orchestrator.

### Expected Payload

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 1245.3,
    "services": {
      "database": "connected",
      "redis": "connected"
    }
  }
}
```

---

## 6. Observability, Logging & Alerting

### Application Logs

- Structured JSON logs emitted via **Pino**.
- Every incoming request is correlated with `X-Request-Id`.
- Sensitive data filtering: passwords, tokens, API keys, and authorization headers are masked before logging.

### Recommended Alerting Rules

| Condition                              |   Severity   | Action                                                 |
| :------------------------------------- | :----------: | :----------------------------------------------------- |
| Health Check fails 2 consecutive polls | **Critical** | Page on-call engineer; check DB connection and memory  |
| 5xx Error Rate > 1% over 5 minutes     |   **High**   | Inspect recent deployments; check provider rate limits |
| Memory Usage > 85%                     | **Warning**  | Scale instance vertically or recycle worker            |
| External Provider Timeout > 5%         | **Warning**  | Inspect Adzuna / Gemini / GitHub upstream status       |

---

## 7. Backup & Disaster Recovery

### Automated Backups

- **PostgreSQL**: Automated daily WAL archiving with 7-day retention (or managed provider snapshots).
- **Storage Volume**: Periodic disk snapshots taken via cloud provider.

### Database Restore Procedure

1. Identify the target snapshot timestamp in the managed database dashboard.
2. Spin up a staging or temporary database instance from the snapshot.
3. Validate schema integrity:
   ```bash
   npx prisma validate
   ```
4. Update the API's `DATABASE_URL` environment variable if performing a full instance cutover.
5. Trigger zero-downtime restart of the API services.

---

## 8. Rollback Procedures

### Application Rollback

If a newly deployed version causes unhandled regressions:

1. In the PaaS console (e.g. Render/Railway), select the previous successful build.
2. Click **Revert to this revision**.
3. Zero-downtime traffic shifts back to the previous stable release.

### Database Migration Rollback

1. Review the failing migration in `apps/api/prisma/migrations/`.
2. Generate a compensatory forward migration (e.g. `revert_column_addition`):
   ```bash
   npx prisma migrate dev --name revert_previous_change
   ```
3. Deploy the fix via `npm run db:migrate:deploy`.

---

## 9. OAuth & Third-Party Provider Configuration

### GitHub OAuth Setup

1. Visit **GitHub Developer Settings** -> **OAuth Apps**.
2. Configure **Homepage URL**: `https://resumind.app`.
3. Configure **Authorization callback URL**: `https://api.resumind.app/api/v1/github/callback`.
4. Copy Client ID and generate Client Secret; paste into production environment variables.

### Google Cloud OAuth Setup

1. In **Google Cloud Console**, navigate to **APIs & Services** -> **Credentials**.
2. Configure **Authorized JavaScript origins**: `https://resumind.app`.
3. Configure **Authorized redirect URIs**: `https://api.resumind.app/api/v1/calendar/callback`.
4. Enable the **Google Calendar API** in the API library.

---

## 10. Security Incident Response Checklist

In the event of suspected token compromise or credential leakage:

1. **Immediate Revocation**:
   - Rotate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` immediately (forces all users to re-authenticate).
   - Invalidate GitHub/Google OAuth client secrets in their respective developer consoles.
   - Rotate `GEMINI_API_KEY` in Google AI Studio / GCP Console.
2. **Audit Logs**:
   - Search access logs using `X-Request-Id` and `userId` filters.
   - Check rate-limiting alerts to verify if brute-force attempts occurred.
3. **Patch & Redeploy**:
   - Deploy updated credentials and restart services.
