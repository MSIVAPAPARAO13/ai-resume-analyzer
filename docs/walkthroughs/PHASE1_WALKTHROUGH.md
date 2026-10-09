# Resumind — Phase 1 Engineering Walkthrough

## 1. What Existed Before Phase 1

Before Phase 1, the repository was a prototype called "ai-resume-analyzer":

- Single-folder React Router v7 and Vite setup.
- Client-side reliance on Puter.js for file storage, key-value persistence, and authentication.
- Zero server-side API, zero tests, and zero relational database.
- WebStorm boilerplate files (`index.html` with counter button demo).

---

## 2. Baseline Findings

- The application compiled cleanly with `npm run build`.
- Vite dev server started on `http://localhost:5173/`.
- Routes `/`, `/auth`, `/upload`, and `/wipe` all responded with HTTP 200.
- All baseline observations and risks were documented in `docs/audit/PHASE1_BASELINE.md`.

---

## 3. Why the New Architecture Exists

To evolve this project into an interview-grade, production-style platform demonstrating modern full-stack engineering (React, TypeScript, Express, PostgreSQL, Prisma, Redis, Docker, and testing), we established:

- **Modular Monorepo Separation:** `apps/web` (frontend), `apps/api` (backend), and `packages/*` (shared types, configs, and utilities).
- **Backend Enclave:** Express server with security headers, Zod validation, and error handling.
- **Relational Persistence:** PostgreSQL with Prisma ORM to transition from client-side Puter KV to a scalable database model.
- **Provider Pattern:** Abstract external dependencies so future AI (Gemini) and job feeds (Adzuna) can be swapped or mocked in testing.

---

## 4. Folder Structure

```
resumind/
├── apps/
│   ├── web/                    # React 19 + React Router v7 Frontend
│   └── api/                    # Express + TypeScript + Prisma Backend
├── packages/
│   ├── shared-types/           # Envelopes, pagination, common types
│   ├── validation/             # Shared Zod schemas
│   ├── config/                 # Shared constants & HTTP status codes
│   ├── utils/                  # Pure utility functions
│   └── ui/                     # Shared UI primitives
├── docs/
│   ├── audit/                  # Baseline audit
│   ├── product/                # Complete PRD (34 sections)
│   ├── architecture/           # Architecture diagrams & layer flows
│   ├── development/            # Development rules and Phase roadmap
│   ├── api/                    # REST API conventions
│   └── walkthroughs/           # Phase walkthrough and result reports
├── docker-compose.yml          # PostgreSQL 16 + Redis 7 services
├── package.json                # Monorepo workspaces configuration
└── tsconfig.base.json          # Root TypeScript configuration
```

---

## 5. Dependencies

- **Frontend:** React 19, React Router 7, Vite, Bootstrap 5, Zustand, TanStack Query, Axios, React Hook Form, Zod, Recharts, Framer Motion, pdfjs-dist.
- **Backend:** Express, Helmet, CORS, dotenv, Pino, pino-http, Zod, @prisma/client, ioredis.
- **Dev & Testing:** TypeScript, tsx, Prisma CLI, Vitest, Supertest, Playwright, ESLint, Prettier.

---

## 6. Installation

Install all monorepo dependencies from the project root:

```bash
npm install
```

---

## 7. Environment Setup

Copy the development template:

```bash
cp .env.development.example .env
```

Default configuration includes:

- `PORT=4000`
- `FRONTEND_URL=http://localhost:5173`
- `DATABASE_URL=postgresql://resumind_user:resumind_password@localhost:5432/resumind_dev?schema=public`
- `REDIS_URL=redis://localhost:6379`

---

## 8. Docker Development Containers

Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

Verify container status:

```bash
docker compose ps
```

---

## 9. PostgreSQL & 10. Prisma

Generate Prisma Client:

```bash
npm run db:generate
```

Run migrations:

```bash
npm run db:migrate
```

Seed initial development data:

```bash
npm run db:seed
```

Launch Prisma Studio:

```bash
npm run db:studio
```

---

## 11. Redis

The Redis connection helper in `apps/api/src/config/redis.ts` connects lazily with exponential backoff and provides health status checks via `checkRedisHealth()`.

---

## 12. Backend Service

Start the Express API server in development watch mode:

```bash
npm run dev:api
```

Query health check endpoint:

```bash
curl http://localhost:4000/api/v1/health
```

Response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "v1",
    "environment": "development"
  }
}
```

---

## 13. Frontend Service

Start the React Router development server:

```bash
npm run dev:web
```

Access at `http://localhost:5173`.

---

## 14. Testing Suite

Run all unit and integration tests across workspaces:

```bash
npm run test
```

Run API integration tests only:

```bash
npm run test:api
```

Run Web unit tests only:

```bash
npm run test:web
```

---

## 15. Playwright E2E Smoke Tests

Execute headless browser tests:

```bash
npx playwright test
```

Or with interactive UI:

```bash
npx playwright test --ui
```

---

## 16. Browser Preview & Verification

Verify existing routes:

1. `http://localhost:5173/` — Dashboard with search, filter, and score trend chart.
2. `http://localhost:5173/auth` — Puter login card.
3. `http://localhost:5173/upload` — Resume upload form and drag-and-drop area.
4. `http://localhost:5173/wipe` — Storage inspection and KV flush utility.

---

## 17. Verification Checklist

Run full project audit scripts:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

---

## 18. Troubleshooting

- **Port Conflict (4000 or 5173 in use):** Update `PORT` or Vite port in configuration.
- **Database Connection Refused:** Verify Docker container is running (`docker compose ps`) and ports are forwarded (`5432:5432`).
- **Prisma Schema Drift:** Run `npm run db:generate` followed by `npm run db:migrate`.

---

## 19. Known Limitations (Phase 1 Scope)

- Authentication is currently handled by Puter.js in the browser; server-side JWT auth will replace this in Phase 2.
- Business entities (Experiences, Resumes, Jobs) are deferred to subsequent phases as planned.
- Existing frontend UI retains its current visual presentation; Bootstrap 5 component migration will occur incrementally.

---

## 20. Phase 2 Starting Point

Phase 2 will implement:

1. Server-side User Authentication with JWT and Refresh Tokens.
2. Google OAuth 2.0 integration.
3. Password hashing with bcrypt.
4. User profile CRUD endpoints.
5. Auth middleware protecting `/api/v1/*` routes.
