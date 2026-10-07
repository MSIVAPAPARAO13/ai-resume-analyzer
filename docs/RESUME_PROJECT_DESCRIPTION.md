# Resumind — Resume Project Description & Impact Bullets

---

## 1. One-Line Project Summary

**Resumind**: An enterprise-grade, full-stack AI career intelligence SaaS that analyzes resumes, matches candidates to jobs, and tailors applications using a hallucination-preventing Evidence Guard backed by verified GitHub and candidate artifacts.

---

## 2. Strong Resume Bullets (Ready for Software Engineering CVs)

- **Engineered an AI-powered Career Intelligence SaaS** using React 19, Express, TypeScript, and PostgreSQL, featuring an anti-hallucination Evidence Guard that verifies LLM-generated resume bullets against authentic candidate project and GitHub commit data.
- **Hardened full-stack application security and reliability** by implementing OWASP Top 10 defenses, magic-byte upload validation, SSRF network filters, tiered Redis rate-limiting, and tenant-isolated authorization across 17 domain modules.
- **Optimized frontend and backend performance**, achieving 100% test pass rates across 207 automated tests and 15 Playwright E2E suites by implementing dynamic chunk-splitting for heavy dependencies (`pdfjs-dist`, `Recharts`) and user-scoped Redis caching.

---

## 3. Five Technical Highlights

1. **Evidence Guard Pattern**: Designed and implemented a deterministic verification pipeline using Google Gemini 1.5 and Zod schemas that strictly prohibits generative AI from fabricating candidate skills or experiences during resume tailoring.
2. **Multi-Provider Resilience Architecture**: Built decoupled provider abstractions for GitHub, Google Calendar, Adzuna, and Resend with bounded network timeouts (10–15s) and automated fallbacks, ensuring zero single-points-of-failure.
3. **Comprehensive Security Posture**: Enforced strict Helmet Content Security Policies, Argon2 password hashing, short-lived JWT access tokens with rotation, and SSRF filtering against loopback, private RFC1918 subnets, and AWS/GCP cloud metadata endpoints.
4. **Bundle & Core Web Vitals Optimization**: Reduced initial client bundle load through route-level code splitting, lazy-loading PDF parsing and charting engines into asynchronous chunks.
5. **Production Quality Gates & Automation**: Established CI/CD pipeline running automated linting, formatting, static typechecks, database schema validation, and end-to-end browser journeys on every commit.

---

## 4. Tech Stack & Technologies

- **Frontend**: React 19, TypeScript, React Router v7 (SSR), Bootstrap 5, Lucide Icons, Axios, Recharts, pdfjs-dist.
- **Backend**: Express 4, Node.js 20, TypeScript, Prisma ORM, PostgreSQL 16, Redis 7, Pino.
- **Security & Auth**: JWT (HMAC-SHA256), Argon2, Helmet CSP, AES-256-GCM token encryption, express-rate-limit.
- **External APIs & Cloud**: Google Gemini SDK, GitHub REST API, Google Calendar API, Adzuna API, Resend, Docker.
- **Testing & Tooling**: Vitest, Playwright, Prettier, ESLint, GitHub Actions CI/CD.

---

## 5. Verified Quantitative Metrics

- **207/207** automated unit and integration tests passed (198 API, 9 Web, 0 failures).
- **15/15** Playwright end-to-end browser suites passed covering all user journeys.
- **0** TypeScript compiler errors across all monorepo workspaces.
- **0** ESLint warnings and errors; 100% Prettier conformity.
- **100%** forward-only database migrations verified with Prisma.
