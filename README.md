# 🚀 Resumind

> **Enterprise-Grade AI Career Intelligence & Resume Optimization SaaS**
> A production-hardened full-stack platform empowering modern candidates with ATS scoring, evidence-backed resume tailoring, GitHub evidence ingestion, application CRM, and interview readiness.

---

## 📌 Overview & Problem Statement

Resumind eliminates the guesswork in job searching:

- **ATS Transparency**: Ingests PDF/DOCX resumes and audits them against transparent ATS rubrics (ATS compatibility, content quality, structural hierarchy, and skill density).
- **Anti-Hallucination ("Evidence Guard")**: Unlike generic AI resume tools that invent experience to pass filters, Resumind grounds all tailored bullet points in verified achievements stored in your canonical **Career Twin** and connected **GitHub repositories**.
- **Unified Career Ecosystem**: Combines resume intelligence, job market matching (Job DNA), an application Kanban CRM, automated GitHub evidence sync, and role-specific STAR-method interview preparation in one coherent platform.

---

## 🛠️ Technology Stack

| Layer                | Technologies                                                                                                                                        |
| :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**         | React 19, TypeScript, React Router v7 (SSR), Bootstrap 5, Zustand, TanStack Query, Axios, React Hook Form, Zod, Recharts, Framer Motion, pdfjs-dist |
| **Backend**          | Node.js 20, Express 4, TypeScript, Zod, Helmet CSP, Tiered Rate Limiting, CORS, Pino, pino-http                                                     |
| **Database & Cache** | PostgreSQL 16, Prisma ORM, Redis 7 (ioredis)                                                                                                        |
| **AI & Providers**   | Google Gemini 1.5 Pro / Flash (`@google/genai`), GitHub OAuth 2.0 & REST API, Google Calendar API, Adzuna API, Resend                               |
| **Testing & CI/CD**  | Vitest (207 unit/integration tests), Playwright (15 E2E suites), GitHub Actions CI/CD                                                               |
| **Cloud & DevOps**   | Render Blueprint (`render.yaml`), Docker multi-stage builds, Docker Compose                                                                         |

---

## 📂 Repository Structure

```
resumind/
├── apps/
│   ├── web/                    # React 19 + React Router v7 SSR Frontend
│   └── api/                    # Express 4 + TypeScript + Prisma Backend API
├── packages/
│   ├── shared-types/           # Shared TypeScript interfaces & envelopes
│   ├── validation/             # Common Zod validation schemas
│   ├── config/                 # Shared constants & HTTP status codes
│   ├── utils/                  # Pure utility functions
│   └── ui/                     # Shared UI component primitives
├── docs/
│   ├── PRODUCTION_RUNBOOK.md   # Production incident, deployment & DR runbook
│   ├── DEPLOYMENT.md           # Step-by-step production cloud deployment guide
│   ├── PORTFOLIO_PROJECT_REPORT.md # Technical case study & architecture review
│   ├── RESUME_PROJECT_DESCRIPTION.md # Executive resume bullets & technical highlights
│   └── walkthroughs/           # Verification logs for Phases 1 through 10
├── .github/workflows/          # Production CI/CD pipelines
├── render.yaml                 # Infrastructure-as-Code Blueprint
├── docker-compose.yml          # Local PostgreSQL & Redis containers
├── package.json                # Monorepo workspaces orchestration
└── tsconfig.base.json          # Root TypeScript configuration
```

---

## 🌟 Key Features

1. **Career Twin**: Single source of truth for verified candidate skills, work history, education, and portfolio projects.
2. **Resume Intelligence**: Multi-page PDF/DOCX parsing, keyword density calculation, and comprehensive ATS scoring.
3. **Job Intelligence & Matching**: Job description ingestion, canonical skill extraction, and bidirectional candidate-to-job match scoring.
4. **Evidence Guard & AI Tailoring**: Google Gemini 1.5 powered bullet tailoring strictly bounded by verified candidate achievements, preventing factual fabrication.
5. **Application CRM**: Kanban-style application pipeline with timeline tracking and status updates.
6. **GitHub Career Evidence**: OAuth 2.0 integration extracting commit history, repositories, and technical evidence directly into candidate profiles.
7. **Interview Intelligence**: Role-tailored behavioral & technical interview question generation with Google Calendar interview event creation.
8. **Career Analytics & Learning Plans**: Aggregated career readiness scores, identified skill gaps, and evidence-building learning roadmaps.

---

## ⚙️ Quick Start (Local Development)

### 1. Clone & Install

```bash
git clone https://github.com/MSIVAPAPARAO13/ai-resume-analyzer.git resumind
cd resumind
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

### 3. Launch PostgreSQL & Redis Containers

```bash
npm run docker:up
# Or: docker compose up -d postgres redis
```

### 4. Database Setup

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5. Launch Applications

```bash
# Terminal 1: Backend API (http://localhost:4000)
npm run dev:api

# Terminal 2: Web Frontend (http://localhost:5173)
npm run dev
```

---

## 🧪 Testing & Quality Gates

```bash
# Run all 207 unit and integration tests
npm run test

# Run end-to-end browser test suites
npm run test:e2e

# Run static quality checks
npm run typecheck
npm run lint
npm run format:check

# Verify database schema
npx prisma validate --schema=apps/api/prisma/schema.prisma
```

---

## 🚀 Production Deployment

Resumind is pre-configured for automated zero-downtime deployment on Render via `render.yaml` or containerized deployment via Docker:

- See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for step-by-step deployment instructions.
- See [docs/PRODUCTION_RUNBOOK.md](docs/PRODUCTION_RUNBOOK.md) for operations, monitoring, alerts, and disaster recovery procedures.

---

## 🔒 Security & Privacy Posture

- **Zero Client Secrets**: All API keys, database credentials, and signing secrets reside exclusively in the server environment.
- **OWASP Hardening**: Strict Helmet Content Security Policy, magic-byte file signature validation, and SSRF loopback/cloud metadata protection.
- **Tenant Isolation**: Every database query scopes data to the authenticated user ID (`where: { userId }`).
- **Private Resumes**: Candidates' resume uploads and profile data are protected and excluded from public search indexing (`noindex, nofollow`).

---

## 🗺️ Project Phases

- [x] **Phase 1**: Foundation + Database + API
- [x] **Phase 2**: Authentication + Career Twin
- [x] **Phase 3**: Resume Intelligence
- [x] **Phase 4**: Job Intelligence + Resume/Job Matching
- [x] **Phase 5**: Gemini + Evidence Guard + AI Resume Tailoring + Adzuna
- [x] **Phase 6**: Application CRM + GitHub Career Evidence
- [x] **Phase 7**: Interview Intelligence + Interview Preparation
- [x] **Phase 8**: Career Analytics + Skill Gap + Learning Plan
- [x] **Phase 8.5**: Full Product QA + UI/UX Audit
- [x] **Phase 9**: Production Hardening (Security + Performance + SEO + A11y)
- [x] **Phase 10**: Production Deployment & Portfolio Readiness

---

## 📄 License

This project is licensed under the MIT License.
