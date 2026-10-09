# Resumind — Production Deployment Guide

This guide provides comprehensive, verified step-by-step instructions for deploying the Resumind application to production managed cloud infrastructure.

---

## 1. Production Architecture Summary

Resumind deploys as a modern modular monolith:

- **Frontend**: React Router v7 with Node.js Server-Side Rendering (`react-router-serve`).
- **Backend**: Express 4 TypeScript REST API with Helmet security headers, tiered rate limiting, and structured logging.
- **Database**: PostgreSQL 16 managed database with automated forward migrations via `npx prisma migrate deploy`.
- **Cache**: Redis 7 for rate-limiting enforcement and analytics caching.
- **Storage**: Persistent disk mount (`/app/uploads`) or S3/R2-compatible storage.

---

## 2. Option A: Deployment via Render (Recommended)

Render provides native monorepo support, integrated PostgreSQL & Redis, zero-downtime rolling deploys, and automated SSL/TLS via Blueprint specification.

### Step 1: Fork or Push to GitHub

Ensure your repository is pushed to GitHub:

```bash
git push origin main
```

### Step 2: Deploy Blueprint in Render

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository: `https://github.com/MSIVAPAPARAO13/ai-resume-analyzer`.
4. Render automatically reads `render.yaml` and provisions:
   - `resumind-api` (Web Service, Node.js)
   - `resumind-web` (Web Service, Node.js)
   - `resumind-db` (PostgreSQL 16)
   - `resumind-redis` (Redis 7)
   - `resumind-uploads` (Persistent Disk: 1GB mounted at `/app/uploads`)

### Step 3: Configure Secret Environment Variables

In the Render dashboard under `resumind-api` -> **Environment**, provide the following non-synced keys:

- `GEMINI_API_KEY`: Your Google AI Studio API key.
- `ADZUNA_APP_ID`: Your Adzuna developer Application ID.
- `ADZUNA_APP_KEY`: Your Adzuna developer Application Key.
- `GITHUB_CLIENT_ID`: GitHub OAuth App Client ID.
- `GITHUB_CLIENT_SECRET`: GitHub OAuth App Client Secret.
- `GOOGLE_CLIENT_ID`: Google Cloud OAuth Client ID.
- `GOOGLE_CLIENT_SECRET`: Google Cloud OAuth Client Secret.
- `RESEND_API_KEY`: Resend API key (optional).

### Step 4: Verification & Automated Migrations

Render automatically executes:

```bash
npm ci && npm run db:generate && npm run build:api && npm run db:migrate:deploy
```

This guarantees schema synchronicity before the API accepts incoming web traffic.

---

## 3. Option B: Containerized Deployment via Docker

For platforms supporting Docker (Railway, Fly.io, AWS ECS, DigitalOcean App Platform):

### Step 1: Multi-Stage Production Build

Build the unified production container:

```bash
docker build -t resumind-app:latest .
```

### Step 2: Run Production Stack with Compose

```bash
# Provision production database and Redis
docker compose up -d postgres redis

# Run database migrations
npm run db:migrate:deploy

# Start web and api services
npm run start:api
npm run start
```

---

## 4. OAuth Application Setup

### GitHub OAuth Application

1. Go to **GitHub Settings** -> **Developer Settings** -> **OAuth Apps** -> **New OAuth App**.
2. **Application name**: `Resumind Production`
3. **Homepage URL**: `https://resumind.app` (or your Render web URL)
4. **Authorization callback URL**: `https://api.resumind.app/api/v1/github/callback`
5. Save the generated **Client ID** and generate a **Client Secret**.

### Google Cloud Console OAuth

1. Go to **Google Cloud Console** -> **APIs & Services** -> **Credentials**.
2. Create **OAuth 2.0 Client ID** (Web application).
3. **Authorized JavaScript origins**: `https://resumind.app`
4. **Authorized redirect URIs**: `https://api.resumind.app/api/v1/calendar/callback`
5. Enable the **Google Calendar API** in the GCP API library.

---

## 5. Domain Configuration & SSL/TLS

### DNS Settings

Point your domain's DNS records to your hosting provider:
| Type | Host | Target / Value | Purpose |
| :--- | :--- | :--- | :--- |
| **CNAME** | `@` / `www` | `resumind-web.onrender.com` | Frontend Web App |
| **CNAME** | `api` | `resumind-api.onrender.com` | Backend REST API |

Render and cloud providers automatically issue and renew free Let's Encrypt TLS certificates.

---

## 6. Post-Deployment Verification & Smoke Test

Execute this verification sequence on the live deployed URL:

1. **API Health Check**:

   ```bash
   curl -i https://api.resumind.app/api/v1/health
   # Expected: HTTP 200 OK, services.database = "connected"
   ```

2. **Security Headers Check**:

   ```bash
   curl -I https://api.resumind.app/api/v1/health
   # Verify presence of:
   # X-Content-Type-Options: nosniff
   # Strict-Transport-Security: max-age=...
   # Content-Security-Policy: ...
   ```

3. **SEO Directives**:

   ```bash
   curl -s https://resumind.app/robots.txt
   curl -s https://resumind.app/sitemap.xml
   ```

4. **User Journey Smoke Test**:
   - Register a new test user account at `/register`.
   - Log into the dashboard at `/login`.
   - Upload a sample PDF resume at `/resumes`.
   - Verify parsing and ATS analysis generation.
   - Run AI resume tailoring against a sample job.
   - Test GitHub connection at `/integrations`.
