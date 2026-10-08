# Resumind Local Development & Troubleshooting Guide

This guide documents the root cause, diagnosis, architecture, operational procedures, and verification steps for running Resumind locally with **PostgreSQL + Prisma + Redis + Express + React**.

---

## 1. Root Cause Analysis: `Can't reach database server at localhost:5432`

### The Error

```text
Invalid `prisma.user.findUnique()` invocation
Can't reach database server at `localhost:5432`
Please make sure your database server is running at `localhost:5432`.
```

### Root Cause

1. **Windows Service Absence**: No native Windows PostgreSQL service was active on port 5432.
2. **Container Engine Status**: Docker Desktop was not running on the Windows host, preventing `docker-compose up -d postgres redis` from running as standard containers.
3. **WSL2 Suspension & Network Isolation**: WSL2 (Ubuntu) was installed with PostgreSQL and Redis packages, but because WSL2 was not actively kept running by a persistent background session, the virtualized subsystem periodically idled and terminated background services. Furthermore, WSL2 default networking can fail to bind port 5432 reliably on Windows host `localhost:5432`.

### The Resolution

1. Created `scripts/start-local-db.js`, an automated supervisor that:
   - Ensures PostgreSQL 16 and Redis 7 are running inside WSL2 (`sudo service postgresql start`, `sudo service redis-server start`).
   - Obtains the WSL2 virtual interface IP.
   - Spins up non-blocking TCP socket forwarders bridging Windows `localhost:5432` → `WSL2:5432` and `localhost:6379` → `WSL2:6379`.
   - Maintains a keep-alive heartbeat daemon ensuring services remain continuously active during local development.

---

## 2. PostgreSQL Setup & Configuration

### Credentials & Database

- **Host**: `localhost`
- **Port**: `5432`
- **Database Name**: `resumind_dev`
- **Username**: `resumind_user`
- **Password**: Configured in local `.env` (development only)
- **Database URL format**:
  ```env
  DATABASE_URL=postgresql://resumind_user:resumind_password@localhost:5432/resumind_dev?schema=public
  ```

### Database Initialization Script

When starting from a fresh environment, verify or initialize with:

```bash
node scripts/start-local-db.js
```

This script validates WSL2 PostgreSQL, initializes the `resumind_user` role and `resumind_dev` database if not present, and opens localhost proxies.

---

## 3. Prisma Schema & Migration Status

Resumind strictly maintains migration history across all phases.

### Applied Migrations

All 7 Prisma migrations are fully applied and synchronized:

1. `20260312000000_init` — Base schema, User, Profile, Auth
2. `20260314000000_evidence_guard_and_tailoring` — Career Twin, Evidence Guard, Tailoring Sessions
3. `20260316000000_crm_and_github` — Application CRM, Events, GitHub Repositories
4. `20260318000000_interview_intelligence` — Interview Setup, Questions, Answer Submissions, Evaluations
5. `20260320000000_analytics_and_learning` — Analytics, Skill Gaps, Learning Plans
6. `20260322000000_fix_oauth_indexes` — OAuth index constraints
7. `20260325000000_add_interview_share_token` — Public interview share tokens

### Migration Commands

- **Check Migration Status**:
  ```bash
  npm run db:migrate:status
  # or: npx prisma migrate status --schema=apps/api/prisma/schema.prisma
  ```
- **Apply Migrations Safely**:
  ```bash
  npm run db:migrate:deploy
  # or: npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
  ```
- **Generate Prisma Client**:
  ```bash
  npm run db:generate
  # or: npx prisma generate --schema=apps/api/prisma/schema.prisma
  ```
- **Seed Development Data**:
  ```bash
  npm run db:seed
  ```
  _Default Dev User_: `demo@resumind.dev` / `Password123!`

> [!CAUTION]
> **Safety Rule**: Never run `prisma migrate reset` or `prisma db push` on environments with existing data. Always preserve the linear migration trail.

---

## 4. Redis Configuration & Fallback

- **Host**: `localhost`
- **Port**: `6379`
- **Redis URL**: `redis://localhost:6379`
- **Graceful Fallback**: The Resumind backend utilizes an in-memory/graceful fallback pattern for session caching and rate-limiting if Redis is temporarily unreachable. However, for full production parity and local cache testing, Redis 7 is actively proxied alongside PostgreSQL via `scripts/start-local-db.js`.

---

## 5. Startup Commands & Development Workflow

### Step 1: Start Database & Redis

```bash
node scripts/start-local-db.js
```

### Step 2: Start API Server

In a terminal:

```bash
npm run dev:api
```

- Listens on `http://localhost:4000`.
- Health check: `GET http://localhost:4000/api/v1/health`.
- Response:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-08T02:02:18.000Z",
    "uptime": 12.34
  }
  ```

### Step 3: Start Web Frontend

In a separate terminal:

```bash
npm run dev
```

- Vite / React Router dev server serves at `http://localhost:5173`.
- Proxies / connects directly to `http://localhost:4000/api/v1`.

---

## 6. Environment Variables Audit

Resumind requires environment configurations separated by workspace. A `.env.example` template provides the blueprint:

### API (`apps/api/.env` or root `.env`)

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://resumind_user:resumind_password@localhost:5432/resumind_dev?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=development_jwt_secret_min_32_characters_long_12345
REFRESH_TOKEN_SECRET=development_refresh_secret_min_32_chars_12345
CORS_ORIGIN=http://localhost:5173
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:4000/api/v1
```

> [!IMPORTANT]
> Never commit `.env` files or API keys (`GEMINI_API_KEY`, `GITHUB_CLIENT_SECRET`, `RESEND_API_KEY`, etc.) to version control.

---

## 7. Common Local Errors & How to Fix Them

### Error A: `Can't reach database server at localhost:5432`

- **Cause**: WSL2 or Docker container stopped, or proxy not running.
- **Fix**: Run `node scripts/start-local-db.js`. Verify with `netstat -ano | findstr :5432`.

### Error B: `rate limit exceeded on /career, /resumes`

- **Cause**: Job search rate limiter (`jobSearchLimiter`) mistakenly mounted at `/api/v1` root instead of `/api/v1/job-search`.
- **Fix**: Fixed in `apps/api/src/app.ts` so `jobSearchLimiter` strictly applies to `/api/v1/job-search`.

### Error C: Tailwind CSS Collapsing Bootstrap Navbar

- **Cause**: Tailwind v4 applies `.collapse { visibility: collapse; }`, rendering Bootstrap's responsive collapse menu invisible.
- **Fix**: Overridden in `apps/web/app/app.css`:
  ```css
  .navbar-collapse.collapse {
    visibility: visible !important;
  }
  ```
  Dropdown user menu converted to controlled React state in `AppNavbar.tsx`.

### Error D: Prisma UUID Type Casting on String Identifiers

- **Cause**: Querying `OR: [{ id: identifier }, { name: identifier }]` crashes Prisma with `invalid input syntax for type uuid` if `identifier` is not a valid UUID.
- **Fix**: Defensive check with `isUuid(identifier)` before including `{ id: identifier }` in query conditions (fixed in `apps/api/src/modules/github/github.service.ts`).

---

## 8. Verification & Quality Gates

Run the full battery of automated tests to ensure flawless local operation:

```bash
# 1. Typecheck
npm run typecheck

# 2. Linting
npm run lint

# 3. Formatting
npm run format:check

# 4. Unit & Integration Tests (207 tests)
npm test

# 5. Playwright E2E Smoke Tests
npx playwright test tests/e2e/smoke.spec.ts

# 6. Production Builds
npm run build:api
npm run build:web
```

All 6 quality gates must pass cleanly with 0 errors.

---

## 9. Architectural Rationale: Retaining PostgreSQL + Prisma (No MongoDB)

### Why MongoDB Was Explicitly Rejected

Resumind's core domain models represent a deeply interconnected relational graph:

- **Relational Integrity**: `User` → `CareerProfile` → `Experience` / `Education` / `Skill` / `Certification` / `Achievement`.
- **Audit Trails & Events**: `Application` → `ApplicationEvent` with status state machines, timestamps, and foreign key referential integrity.
- **Provable Provenance (Evidence Guard)**: Tailoring sessions (`ResumeTailoringSession`) link resume bullet points to verified `Experience` or `Project` items with strict foreign keys.
- **Transactional Consistency**: Resume tailoring, application status changes, and interview submission flows rely on ACID transactions via `prisma.$transaction()`.
- **Enterprise SaaS Standards**: Switching to MongoDB/Mongoose would discard all relational guarantees, require rewriting hundreds of query layers, and invalidate the existing migration history without technical merit.

PostgreSQL + Prisma remains the standard architecture for both local development and production.

---

## 10. Production Cloud Architecture

In production (Render / Managed Cloud):

- **Web Service**: Node.js / Express API running on Render (`resumind-api`).
- **Database**: Managed PostgreSQL (Render PostgreSQL, Neon, Supabase, or AWS RDS) with SSL enabled (`sslmode=require`).
- **Cache**: Managed Redis (Render Redis or Upstash).
- **Frontend**: Single Page / SSR App served on CDN / Render Static Site or Web Service (`resumind-web`).
- **Schema Management**: Automated via `npx prisma migrate deploy` in the deployment pipeline.
