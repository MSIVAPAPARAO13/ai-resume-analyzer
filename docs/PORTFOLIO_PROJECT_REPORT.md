# Resumind — Enterprise-Grade AI Career Intelligence & Resume Optimization SaaS

## Portfolio Case Study & Engineering Report

---

## 1. Executive Summary

**Resumind** is an AI-powered Career Intelligence and Resume Optimization SaaS designed to solve the critical flaws of modern automated recruiting: resume-job misalignment, keyword mismatch, and pervasive hallucination in generative AI resume tools.

Unlike generic resume generators that fabricate candidate claims to beat Applicant Tracking Systems (ATS), Resumind introduces an **Evidence Guard** architectural pattern that strictly grounds every generated bullet point, match score, and interview suggestion in verified career artifacts from the user's **Career Twin** and connected **GitHub repositories**.

The application was built as a modern full-stack TypeScript modular monolith over 10 disciplined engineering phases, achieving production-grade security, accessibility (WCAG), performance, and 100% test pass rates across 207 automated unit/integration tests and 15 Playwright end-to-end suites.

---

## 2. Technical Architecture & System Design

```
[Client Tier]
  ├── React 19 + TypeScript + Bootstrap 5 + Lucide Icons
  ├── React Router v7 with Node.js Server-Side Rendering (SSR)
  ├── Asynchronous Code Splitting (Isolated pdfjs-dist & Recharts chunks)
  └── WCAG AA Accessibility with full keyboard navigation & ARIA landmarks

[API Gateway & Application Tier]
  ├── Express 4 REST API with modular domain-driven architecture
  ├── Strict Security: Helmet CSP, CORS allowlist, Tiered Rate Limiting
  ├── Security Guards: SSRF IP Blocking, Magic-byte File Validation, Path Traversal Sanitization
  └── Unified Error Handling with X-Request-Id correlation & masked production logs

[Data & Cache Tier]
  ├── PostgreSQL 16 (Relational schemas managed with Prisma ORM)
  ├── Automated Forward Migrations (`prisma migrate deploy`)
  ├── Redis 7 (Rate limit throttling & user-isolated analytics caching)
  └── Persistent Storage (Encrypted file storage for original resume documents)

[AI & External Integration Tier]
  ├── Google Gemini 1.5 Pro / Flash via @google/genai SDK
  ├── Evidence Guard: Deterministic Zod schema validation & anti-hallucination verification
  ├── Adzuna API (Live programmatic job search & market ingestion)
  ├── GitHub OAuth 2.0 (REST API for commit/repo evidence extraction)
  ├── Google Cloud Calendar OAuth (Live interview event scheduling)
  └── Resend API (Transactional candidate notifications)
```

---

## 3. Core Product Features

1. **Candidate Career Twin**: Single source of truth for verified skills, work experiences, degrees, and portfolio projects.
2. **Resume Intelligence & ATS Scoring**: Multi-page PDF/DOCX parser extracting structure, computing ATS compatibility, content quality, and skill density metrics.
3. **Job Intelligence & Semantic Matching**: Job description ingestion, canonical skill extraction, and bidirectional candidate-to-job match scoring.
4. **Evidence Guard & AI Tailoring**: Gemini-powered resume bullet re-writing strictly bounded by verified candidate achievements, preventing factual inflation or AI fabrication.
5. **Application CRM & Kanban Pipeline**: Full job application tracking lifecycle with status milestones (`APPLIED`, `INTERVIEWING`, `OFFER`, `REJECTED`).
6. **GitHub Career Evidence**: OAuth integration automatically ingesting commit activity, top programming languages, and project repositories into the Career Twin.
7. **Interview Intelligence & Mock Prep**: Role-specific technical and behavioral question generation, star-method scoring, and automated Google Calendar scheduling.
8. **Career Analytics & Skill Gap Engine**: Aggregated readiness scores across target roles, identified missing proficiencies, and automated learning plan generators.

---

## 4. Engineering Quality, Security & Hardening Highlights

| Area                       | Implementation Details                                                                                                                                                                          |
| :------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication & AuthZ** | HMAC-SHA256 JWT access tokens (15m expiry), refresh tokens (7d), user-isolated Prisma queries (`where: { userId }`), preventing cross-tenant leakage.                                           |
| **OWASP Security**         | Magic-byte binary verification (`%PDF-`, `PK\x03\x04`), SSRF guard blocking private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.1`, cloud metadata `169.254.169.254`). |
| **Rate Limiting**          | Tiered Redis-backed rate limiting (20 req / 15m for auth, 60 req / 15m for AI/external queries, 300 req / 15m for general API).                                                                 |
| **Frontend Performance**   | Route-level code splitting separating heavy libraries (`pdfjs-dist`: 310 kB, `Recharts`: 340 kB) into lazy-loaded asynchronous chunks.                                                          |
| **Public SEO & Privacy**   | Public pages indexed with OpenGraph & canonical tags; all authenticated app areas protected by `<meta name="robots" content="noindex, nofollow" />` and `robots.txt` disallows.                 |
| **Accessibility (WCAG)**   | Semantic HTML5 landmarks, visible focus rings, form inputs tied to matching `<label for>`, tested without mouse navigation.                                                                     |

---

## 5. Quantitative Verification Metrics

- **Unit & Integration Tests**: **207 passed** (198 API tests, 9 Web tests, 1 skipped, 0 failures)
- **End-to-End Test Coverage**: **15/15 passed** (Playwright test suites covering Golden Path and Production Hardening)
- **TypeScript Typecheck**: **0 errors** across monorepo (`@resumind/web` and `@resumind/api`)
- **Linting & Code Style**: **0 ESLint errors**, **100% Prettier conformity**
- **Prisma Schema**: **Valid 🚀** with forward-only migrations
- **Build Integrity**: **Clean client and SSR server bundles** generated via Vite and TSC

---

## 6. Key Architectural Takeaways

1. **Deterministic Grounding Over Unbounded AI**: Rather than allowing LLMs to freely hallucinate resume content, constraining models with deterministic Zod schemas and verified candidate context yields significantly higher trust and ATS performance.
2. **Resilience Through Graceful Degradation**: Structuring external providers (Redis, GitHub, Adzuna, Google Calendar) as non-blocking dependencies ensures that outages in third-party services never take down core application functionality.
