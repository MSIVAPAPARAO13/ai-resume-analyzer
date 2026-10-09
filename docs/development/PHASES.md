# Resumind — Engineering Phase Roadmap

This document outlines the phased development roadmap for **Resumind**, taking it from the Phase 1 engineering foundation through full portfolio and interview readiness.

---

## 📌 Phase Overview Matrix

| Phase       | Title                            | Focus Area                                                                                            | Status             |
| :---------- | :------------------------------- | :---------------------------------------------------------------------------------------------------- | :----------------- |
| **Phase 1** | **Foundation & Architecture**    | Monorepo setup, Express API, PostgreSQL/Prisma, Redis, Docker, Testing setup, PRD & Architecture docs | 🟡 **IN PROGRESS** |
| **Phase 2** | **Authentication & User System** | Secure JWT auth, refresh tokens, Google OAuth, user sessions, profile management                      | ⚪ Planned         |
| **Phase 3** | **Career Twin Engine**           | Canonical work experience, skills, education, projects, achievements, and Evidence Guard              | ⚪ Planned         |
| **Phase 4** | **Resume Intelligence & ATS**    | PDF text extraction, structured ATS scoring, rubric feedback, section-by-section audit                | ⚪ Planned         |
| **Phase 5** | **Job Intelligence & DNA**       | Adzuna provider integration, job description parsing, keyword extraction, match score                 | ⚪ Planned         |
| **Phase 6** | **Tailoring & Versioning**       | Contextual resume tailoring, cover letter generator, version history diffs, PDF export                | ⚪ Planned         |
| **Phase 7** | **Application CRM & Interviews** | Kanban job tracker, timeline events, AI mock interview simulator, skill-gap engine                    | ⚪ Planned         |
| **Phase 8** | **Production & CI/CD**           | Production Docker images, GitHub Actions CI/CD, rate limiting, monitoring & analytics                 | ⚪ Planned         |

---

## 🚀 Phase 1: Foundation + Architecture (CURRENT)

- **Scope:**
  - Full baseline audit and verification of existing prototype.
  - Antigravity workspace development rules (`.agents/rules/*`).
  - Monorepo structure (`apps/web`, `apps/api`, `packages/*`).
  - Express.js backend with Helmet, CORS, request IDs, and `/api/v1/health`.
  - PostgreSQL schema and Prisma ORM models (`User`, `CareerProfile`).
  - Redis connection helper in Docker Compose.
  - Vitest unit/integration testing suite and Playwright E2E smoke tests.
  - Comprehensive PRD, Architecture, and Development documentation.

---

## 🔐 Phase 2: Authentication & Security

- **Scope:**
  - Server-side JWT authentication with short-lived access tokens and Redis-backed refresh tokens.
  - Google OAuth 2.0 integration.
  - Role-based access control and user ownership middleware.
  - Password hashing with bcrypt.
  - Auth routes: `/api/v1/auth/register`, `/login`, `/refresh`, `/logout`, `/me`.

---

## 🧬 Phase 3: Career Twin & Evidence Guard

- **Scope:**
  - Canonical career profile database models: `Experience`, `Education`, `Skill`, `Project`, `Achievement`, `Evidence`.
  - CRUD operations for the Career Twin.
  - **Evidence Guard**: Prevents resume hallucination by verifying that any claimed skill or bullet point maps to verified career history.

---

## 🤖 Phase 4: Resume Parsing & ATS Intelligence

- **Scope:**
  - Multi-page PDF and DOCX text extraction pipeline.
  - LLM-powered resume evaluation engine using provider abstraction (`GeminiProvider`).
  - Comprehensive scoring across ATS compatibility, content strength, structure, and tone.
  - Actionable improvement tips with detailed explanations.

---

## 🎯 Phase 5: Job Intelligence & Match Scoring

- **Scope:**
  - External job board integration (`JobProvider` -> `AdzunaProvider`).
  - Job DNA parser: extracts core requirements, bonus skills, and years of experience.
  - Semantic match scoring between user's Career Twin and job postings.

---

## ✍️ Phase 6: Resume Tailoring & Version Evolution

- **Scope:**
  - Targeted resume tailoring: generates optimized bullet points for a specific job description.
  - Cover letter generator aligned with job requirements.
  - Resume version tracking and visual diffing.
  - High-fidelity PDF rendering and export.

---

## 💼 Phase 7: Application CRM & Interview Preparation

- **Scope:**
  - Full application lifecycle tracker (Wishlist, Applied, Interviewing, Offer, Rejected).
  - Interview preparation assistant: AI-generated role-specific behavioral and technical questions.
  - STAR method answer evaluator.
  - Skill-gap analysis engine with learning resource recommendations.

---

## 🚢 Phase 8: Production Hardening & CI/CD

- **Scope:**
  - Multi-stage Dockerfiles for frontend and API production builds.
  - GitHub Actions CI/CD workflows for automated testing and linting.
  - Structured error monitoring and telemetry.
  - Performance tuning and SEO audit.
