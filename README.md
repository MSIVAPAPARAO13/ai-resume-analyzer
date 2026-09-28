# 🚀 Resumind

> **AI-Powered Career & Resume Optimization Platform**
> A modular, production-style full-stack application built to empower modern professionals with ATS scoring, evidence-backed resume tailoring, and interview readiness.

---

## 📌 Overview & Problem Statement

Resumind eliminates the guesswork in job searching:

- **ATS Black Boxes:** Resumes are audited against transparent ATS rubrics (Score, Content, Tone, Structure, Skills) with clear, actionable improvement recommendations.
- **Zero Hallucination ("Evidence Guard"):** Unlike standard AI resume builders, Resumind grounds all suggested bullet points in verified career achievements stored in your canonical **Career Twin**.
- **Unified Workflow:** Combines resume intelligence, job market matching (Job DNA), an application Kanban CRM, and role-specific STAR-method interview preparation in one platform.

---

## 🛠️ Technology Stack

| Layer                   | Technologies                                                                                                                            |
| :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**            | React 19, React Router v7, Vite, Bootstrap 5, Zustand, TanStack Query, Axios, React Hook Form, Zod, Recharts, Framer Motion, pdfjs-dist |
| **Backend**             | Node.js, Express, TypeScript, Zod, Helmet, CORS, Pino, pino-http, dotenv                                                                |
| **Database & Cache**    | PostgreSQL 16, Prisma ORM, Redis 7 (ioredis)                                                                                            |
| **Testing**             | Vitest, Supertest, Playwright, React Testing Library                                                                                    |
| **DevOps & Containers** | Docker, Docker Compose, npm workspaces monorepo                                                                                         |

---

## 📂 Repository Structure

```
resumind/
├── apps/
│   ├── web/                    # React 19 + React Router v7 Frontend
│   └── api/                    # Express.js + Prisma Backend REST API
├── packages/
│   ├── shared-types/           # Shared TypeScript interfaces & envelopes
│   ├── validation/             # Common Zod validation schemas
│   ├── config/                 # Shared constants & HTTP status codes
│   ├── utils/                  # Pure utility functions
│   └── ui/                     # Shared UI component primitives
├── docs/
│   ├── audit/                  # Baseline inspection report
│   ├── product/                # Complete Product Requirements Document (PRD)
│   ├── architecture/           # Architecture diagrams & provider pattern
│   ├── development/            # Development rules & Phase roadmap
│   ├── api/                    # REST API conventions & standards
│   └── walkthroughs/           # Phase walkthrough & result reports
├── docker-compose.yml          # Local PostgreSQL & Redis containers
├── package.json                # Monorepo workspaces orchestration
└── tsconfig.base.json          # Root TypeScript configuration
```

---

## ⚙️ Prerequisites

- **Node.js**: `>= 20.0.0` (Recommended: v24.x)
- **npm**: `>= 10.0.0`
- **Docker & Docker Compose**: For local PostgreSQL and Redis

---

## 🚀 Quick Start & Installation

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/adrianhajdin/ai-resume-analyzer.git resumind
cd resumind
npm install
```

### 2. Configure Environment Variables

Copy the development environment template:

```bash
cp .env.development.example .env
```

Default local variables:

```ini
PORT=4000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://resumind_user:resumind_password@localhost:5432/resumind_dev?schema=public
REDIS_URL=redis://localhost:6379
```

### 3. Start Database & Cache Containers

```bash
docker compose up -d postgres redis
```

### 4. Database Setup (Prisma)

Generate Prisma Client:

```bash
npm run db:generate
```

Apply migrations and seed data:

```bash
npm run db:migrate
npm run db:seed
```

Inspect database via Prisma Studio:

```bash
npm run db:studio
```

### 5. Start Applications

**Start Backend API (`http://localhost:4000`):**

```bash
npm run dev:api
```

Health Check:

```bash
curl http://localhost:4000/api/v1/health
```

**Start Frontend Application (`http://localhost:5173`):**

```bash
npm run dev
# or
npm run dev:web
```

---

## 🧪 Testing Suite

### Run Unit & Integration Tests (Vitest)

```bash
# Run all tests across workspaces
npm run test

# Run backend API integration tests
npm run test:api

# Run frontend unit tests
npm run test:web
```

### Run End-to-End Smoke Tests (Playwright)

```bash
# Headless E2E tests
npm run test:e2e

# Interactive UI test runner
npx playwright test --ui
```

### Type Checking & Linting

```bash
npm run typecheck
npm run lint
npm run format:check
```

---

## 🗺️ Product Roadmap

- [x] **Phase 1: Foundation & Architecture** (Monorepo, Express API, PostgreSQL/Prisma, Redis, Docker, Tests, PRD & Architecture docs)
- [ ] **Phase 2: Authentication & Security** (Server-side JWT, Refresh Tokens, Google OAuth, User Sessions)
- [ ] **Phase 3: Career Twin & Evidence Guard** (Career Graph, Experiences, Skills, Anti-Hallucination Guard)
- [ ] **Phase 4: Resume Parsing & ATS Intelligence** (Multi-page PDF extraction, Rubric Evaluation, Gemini AI)
- [ ] **Phase 5: Job Intelligence & Match Scoring** (Adzuna job integration, Job DNA parsing, Semantic Match Score)
- [ ] **Phase 6: Resume Tailoring & Version Evolution** (Dynamic tailoring, Cover Letters, PDF Export)
- [ ] **Phase 7: Application CRM & Interview Prep** (Kanban Board, STAR-format Mock Interviews, Skill Gaps)
- [ ] **Phase 8: Production Hardening & CI/CD** (Docker Production builds, GitHub Actions, Rate Limiting)

---

## 🔒 Security & Privacy Notes

- **Zero Secrets in Client**: All API keys, database credentials, and signing secrets reside exclusively in the server environment.
- **Input Sanitization**: Every inbound request is validated through strict Zod schemas before reaching business logic.
- **HTTP Hardening**: Helmet sets standard security headers (`Content-Security-Policy`, `HSTS`, `X-Content-Type-Options`).
- **Private Resumes**: Candidates' resume uploads and profile data are protected and excluded from public search indexing (`noindex, nofollow`).

---

## 📄 License

This project is licensed under the MIT License.
