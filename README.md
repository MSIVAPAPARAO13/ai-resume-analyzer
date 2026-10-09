<p align="center">
  <img width="692" height="210" alt="Resumind Banner" src="https://github.com/user-attachments/assets/7daedb09-167b-483a-981c-bd9be3889208" />
</p>

# 🚀 Resumind — AI Career Intelligence & Resume Optimization SaaS

> **Enterprise-Grade AI Career Intelligence, Anti-Hallucination Resume Tailoring & Growth CRM**  
> Built with React 19, Express 4, TypeScript, Prisma ORM, PostgreSQL 16, Redis 7, and Google Gemini AI.

---

## 📌 Product Overview

Searching for jobs and optimizing resumes has become an opaque, noisy process dominated by applicant tracking systems (ATS) and generic generative AI that fabricates claims.

**Resumind** solves this by treating candidate history as a verifiable **Career Twin**:
1. **ATS Transparency**: Ingests PDF/DOCX resumes, scores formatting, structure, and keyword density against transparent ATS rubrics.
2. **Evidence Guard™ (Anti-Hallucination)**: Tailors resumes to job descriptions while strictly constraining bullet points to verified achievements in the user's Career Twin and connected GitHub repositories. Unverified claims are flagged as `UNSUPPORTED` or `NEEDS_REVIEW`.
3. **Natural Slate-Indigo Aesthetics**: Premium cosmic slate gradient canvas, frosted glass depth (`backdrop-filter: blur(16px)`), luminous borders, and fluid micro-animations.
4. **SEO & Growth Ready**: Full Schema.org JSON-LD structured data, dynamic OpenGraph & Twitter meta tags, semantic HTML5 structure, and high-converting public landing experience.
5. **Unified Career Operations**: Integrates ATS scoring, Job DNA extraction, application pipeline CRM, role-specific STAR mock interviews, Google Calendar sync, and evidence-building learning plans into one cohesive platform.

---

## 📸 Product Screenshots (Captured Live from Application)

### 🌟 High-Converting SEO Landing Page
![Resumind Landing Page](docs/screenshots/01-landing.png)

### 🛡️ AI Resume Tailoring Studio with Evidence Guard™
![AI Tailoring Studio](docs/screenshots/11-ai-tailoring.png)

### 🏠 Command Center Dashboard
![Resumind Dashboard](docs/screenshots/04-dashboard.png)

### 💼 Career Twin — Verified Profile Architecture
![Career Twin](docs/screenshots/05-career-twin.png)

### 📄 Resume Intelligence & ATS Diagnostics
![Resume Analysis](docs/screenshots/08-resume-analysis.png)

### 🎯 Job DNA & Match Matrix
![Job Match](docs/screenshots/10-job-match.png)

### 📋 Applications Pipeline CRM
![Applications Pipeline](docs/screenshots/12-applications.png)

### 🎙️ Interview Intelligence & Mock Simulation
![Interview Intelligence](docs/screenshots/13-interviews.png)

### 📊 Career Velocity & Skill Gap Intelligence
![Career Analytics](docs/screenshots/15-analytics.png)

### 🔍 Skill Gaps Diagnostics
![Skill Gaps](docs/screenshots/16-skill-gaps.png)

### 🎓 Evidence-Building Learning Plans
![Learning Plans](docs/screenshots/17-learning-plans.png)

### 🔌 Google Calendar Integration
![Google Calendar Integration](docs/screenshots/14-calendar-integration.png)

### 🔐 Sign In & Authentication
![Sign In](docs/screenshots/03-login.png)

---

## 🏗️ Architecture & System Design

```mermaid
graph TD
    Client["React 19 + Bootstrap 5 Frontend<br/>(React Router v7 / Vite)"]
    API["Express 4 + TypeScript REST API<br/>(/api/v1/*)"]
    DB[(PostgreSQL 16 Database<br/>Prisma ORM)]
    Cache[(Redis 7 Cache & Rate Limiting)]
    Gemini["Google Gemini AI API<br/>(Explainable ATS & Tailoring)"]
    Adzuna["Adzuna Job Search API"]
    GitHub["GitHub OAuth & REST API<br/>(Code Evidence Sync)"]
    GCal["Google Calendar OAuth<br/>(Interview Scheduling)"]

    Client -->|JWT Bearer Requests| API
    API -->|Prisma Queries| DB
    API -->|Rate Limits & Sessions| Cache
    API -->|Anti-Hallucination Prompts| Gemini
    API -->|Job Market Discovery| Adzuna
    API -->|OAuth / Repositories| GitHub
    API -->|OAuth / Calendar Events| GCal
```

---

## 🛠️ Technology Stack

| Layer | Technologies & Versions |
|:---|:---|
| **Frontend** | React `^19.0.0`, TypeScript `^5.7.3`, React Router `^7.3.1`, Bootstrap `^5.3.3`, Zustand `^5.0.3`, TanStack Query `^5.66.9`, Axios `^1.8.1`, Recharts `^2.15.1`, pdfjs-dist `^4.10.38` |
| **Backend API** | Node.js `20+`, Express `^4.21.2`, TypeScript `^5.7.3`, Zod `^3.24.2`, Helmet `^8.0.0`, Argon2 `^0.45.1`, jsonwebtoken `^9.0.3`, Pino `^9.6.0`, Multer `^2.4.0` |
| **Database & ORM** | PostgreSQL 16, Prisma ORM `^6.4.1` / `@prisma/client 6.19.3` |
| **Caching & Queues**| Redis 7 (`ioredis ^5.6.0`) |
| **AI & External APIs**| Google Gemini AI (`@google/genai ^2.27.0`), GitHub REST API, Google Calendar API, Adzuna API |
| **Testing & E2E** | Vitest `^3.0.8`, Playwright `^1.50.1`, Supertest `^7.0.0` |
| **Design System** | Google Stitch Design Tokens (`--rm-*`), Bootstrap 5 CSS, Plus Jakarta Sans, Inter |

---

## ⚙️ Prerequisites & Environment Configuration

### Prerequisites
- Node.js 20 LTS or higher
- npm 10 or higher
- PostgreSQL 16
- Redis 7

### Environment Setup

Copy `.env.example` in `apps/api/.env` and update secrets as needed:

```bash
# Core
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
CORS_ORIGIN=http://localhost:5173

# Database & Cache
DATABASE_URL=postgresql://resumind_user:resumind_password@localhost:5432/resumind_dev?schema=public
REDIS_URL=redis://localhost:6379

# Authentication Secrets
JWT_ACCESS_SECRET=dev-access-secret-min-64-characters-random-string
JWT_REFRESH_SECRET=dev-refresh-secret-min-64-characters-random-string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GITHUB_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Optional External Providers (Fallback mocks active in local development)
GEMINI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
```

---

## 🚀 Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start PostgreSQL & Redis
In native Windows / WSL2 environments:
```bash
node scripts/start-local-db.js
```
Or via Docker:
```bash
docker compose up -d postgres redis
```

### 3. Generate Prisma & Deploy Migrations
```bash
npm run db:generate
npm run db:migrate:deploy
```

### 4. Seed Deterministic Development Data
```bash
npm run db:seed
```

### 5. Launch Full-Stack Application
In terminal 1 (API Server):
```bash
npm run dev:api
```
In terminal 2 (Web Client):
```bash
npm run dev:web
```

- **Web Application**: [http://localhost:5173](http://localhost:5173)
- **API Health Check**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

---

## 🔑 Demo Account Credentials

The local database contains an active, pre-populated demonstration profile:

| Field | Value |
|:---|:---|
| **Email** | `alex.morgan.qa@resumind.dev` (or `demo@resumind.dev`) |
| **Password** | `Password123!` |
| **Target Role** | Full Stack Developer |
| **Experience** | Junior Full Stack Engineer at Apex Cloud Innovations |
| **Resumes** | `Alex_Morgan_FullStack_Resume.pdf` (Score: 86%, ATS: 91%) |
| **Applications** | 6 tracked CRM applications across all stages |
| **Learning Plans** | Docker Mastery (40% progress) |

---

## 🧪 Testing & Quality Gates

Run all quality checks using verified repository scripts:

```bash
# TypeScript Typecheck (Web + API)
npm run typecheck

# Unit & Integration Tests (Vitest)
npm run test

# Frontend Production Build
npm run build:web

# Backend Production Build
npm run build:api

# End-to-End Test Suite (Playwright)
npm run test:e2e
```

---

## 🔒 Security Architecture

1. **Strict Tenant Isolation**: All database operations query strictly by `userId` resolved from signed JWT claims. Direct API access to other candidates' records is blocked (returns 404/403).
2. **Password Security**: Passwords hashed using Argon2 with unique salts. Plaintext passwords are never logged or stored.
3. **Evidence Guard™**: AI resume suggestions are validated against verified Career Twin entries. Unsupported assertions are highlighted in red to prevent hallucinated claims.
4. **Encrypted OAuth Tokens**: External OAuth tokens for Google Calendar and GitHub are encrypted in PostgreSQL using AES-256-GCM.
5. **Hardened HTTP Headers**: Helmet enforces CSP, strict MIME sniffing protection, clickjacking defense (`X-Frame-Options: DENY`), and modern `Permissions-Policy`.

---

## 📦 Documentation Directory

- [CALENDAR_INTEGRATION_AUDIT.md](docs/CALENDAR_INTEGRATION_AUDIT.md) — Google Calendar OAuth audit, root cause & remediation
- [INTERACTIVE_ELEMENT_AUDIT.md](docs/INTERACTIVE_ELEMENT_AUDIT.md) — Exhaustive audit of all controls, buttons, and forms
- [DATA_SOURCE_AUDIT.md](docs/DATA_SOURCE_AUDIT.md) — Audit proving zero hardcoded metrics and live API backing
- [DEPLOYMENT_READINESS_REPORT.md](docs/DEPLOYMENT_READINESS_REPORT.md) — Production container & cloud deployment readiness
- [PRODUCT_QA_REPORT.md](docs/PRODUCT_QA_REPORT.md) — Master product QA audit and verification report
- [DESIGN.md](docs/DESIGN.md) — Extracted design tokens and visual guidelines
- [STITCH_PROJECT_INVENTORY.md](docs/STITCH_PROJECT_INVENTORY.md) — Complete 14-screen Google Stitch inventory
- [LOCAL_DEMO_DATA.md](docs/LOCAL_DEMO_DATA.md) — Seed schema and Alex Morgan demo dataset specification
