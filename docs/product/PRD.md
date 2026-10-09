# Resumind — Product Requirements Document (PRD)

---

## 1. Product Vision

**Resumind** is an intelligent, developer-friendly Career & Resume Optimization Platform. It acts as an interactive "Career Twin" for modern professionals, empowering job seekers to store their canonical career milestones, audit resumes against ATS algorithms, analyze target job market requirements, and generate tailored, evidence-backed resumes without AI hallucination.

---

## 2. Problem Statement

Job seekers currently face fragmented, low-signal job application workflows:

- **ATS Black Boxes:** Generic resumes get discarded by Applicant Tracking Systems (ATS) due to mismatched keywords or formatting parse errors.
- **AI Hallucination in Resume Tools:** Typical generative AI resume builders invent fake job titles, metrics, or technologies that candidates cannot defend during interviews.
- **Disjointed Workflow:** Candidates juggle resume PDFs in Google Drive, job links in Notion, notes in spreadsheets, and cover letters across text files.
- **Lack of Actionable Feedback:** Job rejection emails rarely explain _why_ a candidate was not selected.

---

## 3. Target Users

1. **Active Job Seekers:** Software engineers, product managers, and tech professionals actively applying to multiple positions per week.
2. **Career Changers:** Professionals transitioning across disciplines who need to identify and bridge transferrable skills.
3. **Passive Candidates / Lifelong Career Builders:** Professionals curating their achievements and projects over time.

---

## 4. User Pain Points

- Spending 2-3 hours manually customizing resumes for every single application.
- Uncertain whether a resume format will parse accurately in Workday, Greenhouse, or Lever.
- Lack of clarity on how closely their actual experience matches a job posting.
- Difficulty tracking application states (Applied, Screen, Tech Round, Offer).

---

## 5. Product Goals

- Provide an ATS compatibility audit with transparent rubrics (Content, Structure, Tone, Skills).
- Establish a single source of truth ("Career Twin") for verified achievements.
- Deliver context-aware, evidence-guarded resume tailoring that prevents hallucinations.
- Offer an integrated application CRM and mock interview simulator.

---

## 6. Non-Goals

- Resumind is **not** an autonomous job application bot (no auto-submitting or scraping behind CAPTCHAs).
- Resumind is **not** a social professional network (not competing with LinkedIn connections or feed).
- Resumind is **not** an enterprise HR applicant tracking system for recruiters.

---

## 7. Product Principles

1. **Evidence First (Zero Hallucination):** Every suggested bullet point must be anchored to verified career history.
2. **Speed & Clarity:** Provide immediate, high-fidelity visual feedback without bloated workflows.
3. **Privacy & Data Ownership:** The candidate's career data belongs to them. No public indexing of private resumes.
4. **Developer-Grade Engineering:** Modular architecture, clean APIs, strict TypeScript safety, and automated test coverage.

---

## 8. User Journeys

1. **Ingestion & Baseline Audit:** The candidate uploads their current resume PDF -> views side-by-side ATS score breakdown and actionable tips.
2. **Career Twin Construction:** The candidate imports or enriches their canonical history (roles, metrics, skills).
3. **Target Job Analysis:** The candidate pastes a target job URL or description -> the engine parses "Job DNA" and calculates a Match Score.
4. **Tailored Generation & Export:** Resumind suggests evidence-backed bullet point refinements -> the candidate exports a clean PDF.
5. **Interview Readiness:** The candidate reviews tailored STAR-format behavioral questions for that specific role.

---

## 9. Career Twin

_Planned for Phase 3_

- A structured relational graph of the user's professional journey.
- Contains verified `Experiences`, `Projects`, `Skills`, `Education`, and `Achievements`.
- Serves as the immutable grounding database for all future AI generation.

---

## 10. Resume Intelligence

_Baseline Prototype Implemented; Full Engine Planned for Phase 4_

- Evaluates resumes across 5 key dimensions:
  1. **ATS Score (0-100):** Parseability, keyword matching, section structure.
  2. **Content Score:** Use of strong action verbs, quantifiable metrics, and impact.
  3. **Structure Score:** Clear chronological flow, visual hierarchy.
  4. **Tone & Style:** Professional voice, brevity, active voice.
  5. **Skills Alignment:** Hard vs soft skills categorization.

---

## 11. Job Intelligence & Job DNA

_Planned for Phase 5_

- Integrates with external job board APIs (Adzuna) to fetch live job postings.
- "Job DNA" parser extracts required skills, preferred qualifications, and seniority levels.

---

## 12. Application Readiness Score

_Planned for Phase 5_

- A composite metric (0-100%) indicating how prepared the candidate's profile is for a specific job posting before applying.

---

## 13. Evidence Guard

_Planned for Phase 3 & 4_

- Guardrail engine that blocks generative LLMs from claiming technologies or achievements not present in the user's Career Twin.

---

## 14. Resume Tailoring

_Planned for Phase 6_

- Intelligently highlights and reorders existing achievements to emphasize competencies most relevant to the target job description.

---

## 15. Resume Evolution & Versioning

_Planned for Phase 6_

- Maintains an audit log of every resume variation generated, showing diffs between versions and application outcomes.

---

## 16. Application CRM

_Planned for Phase 7_

- Kanban board interface for managing applications through stages: `Wishlist`, `Applied`, `Screening`, `Interviewing`, `Offer`, `Rejected`.

---

## 17. Interview Preparation

_Planned for Phase 7_

- AI-generated behavioral and technical mock interview questions tailored to the specific target role.
- STAR-method (Situation, Task, Action, Result) answer critique.

---

## 18. Skill Gap Engine

_Planned for Phase 7_

- Identifies missing skills required by target roles and provides curated learning pathways.

---

## 19. Career Analytics

_Phase 1 Prototype: Basic score chart; Advanced Analytics Planned for Phase 7_

- Line charts and distributions tracking ATS score progression over time across job applications.

---

## 20. Public Website

_Phase 1: Baseline landing and auth pages; Advanced Landing Planned for Phase 8_

- Clean, SEO-optimized marketing pages explaining platform capabilities.

---

## 21. SEO Requirements

- Public marketing routes must have semantic HTML, unique `<title>` and `<meta name="description">` tags, OpenGraph previews, and canonical URLs.
- All authenticated application views (`/app/*`, `/resumes/*`) must strictly disallow web crawlers (`<meta name="robots" content="noindex, nofollow">`).

---

## 22. Accessibility (a11y)

- Target: WCAG 2.1 AA Compliance.
- Strict keyboard navigability for modal dialogs and accordions.
- High-contrast visual score badges and color-blind accessible charts.

---

## 23. Security & Privacy

- **Phase 1 Status:** Helmet HTTP security headers, CORS origin restriction, request ID tracking, and centralized error redaction.
- **Phase 2+:** Server-side JWT authentication with Redis token revocation, bcrypt password hashing, and encrypted document storage.

---

## 24. Performance

- Target 90+ Lighthouse performance score.
- Fast initial page loads via server-side rendering (SSR) and route-level code splitting.
- Heavy document rasterization offloaded to background Web Workers (`/pdf.worker.js`).

---

## 25. AI Architecture

- **Phase 1:** Puter.js GPT-4o-mini integration for rapid prototype evaluation.
- **Phase 4+:** Dedicated server-side `AIProvider` interface with Google Gemini 1.5 Pro / Flash implementation, structured JSON output validation via Zod, and rate-limited processing.

---

## 26. RAG (Retrieval-Augmented Generation) Architecture

_Planned for Phase 4+_

- Career milestones embedded into vector embeddings stored in PostgreSQL via `pgvector`.
- Semantic search fetches top-k relevant career achievements matching target job keywords.

---

## 27. Database Architecture

- **Phase 1 (Implemented):** PostgreSQL 16 schema with Prisma ORM models for `User` and `CareerProfile`.
- **Phase 2+:** Full relational schema spanning experiences, skills, resumes, jobs, and applications.

---

## 28. API Architecture

- **Phase 1 (Implemented):** Express.js REST API with structured response envelopes, correlation IDs, and `/api/v1/health` endpoint.
- **Phase 2+:** Modular endpoints for auth, career twin, resumes, and analytics.

---

## 29. Testing Architecture

- **Phase 1 (Implemented):**
  - Unit tests via **Vitest**.
  - Integration tests via **Supertest**.
  - E2E smoke tests via **Playwright**.

---

## 30. Deployment Architecture

- **Phase 1 (Implemented):** Containerized local development environment via `docker-compose.yml` for PostgreSQL 16 and Redis 7.
- **Phase 8 (Planned):** Production container builds and cloud deployment (e.g. Cloud Run, Railway, or AWS).

---

## 31. Future Integrations

- Google OAuth 2.0.
- Adzuna Job Market Search API.
- Resend transactional email API.
- Stripe billing (deferred for portfolio focus).

---

## 32. Product Roadmap

- **Phase 1 (Current):** Engineering foundation, monorepo, backend API, database models, Docker, tests, and documentation.
- **Phase 2:** Authentication & User Identity.
- **Phase 3:** Career Twin & Profile Ingestion.
- **Phase 4:** Resume Intelligence & ATS Evaluation Engine.
- **Phase 5:** Job Intelligence & Match Scoring.
- **Phase 6:** Resume Tailoring & Version Evolution.
- **Phase 7:** Application CRM & Interview Prep.
- **Phase 8:** Production Hardening & CI/CD.

---

## 33. Success Criteria

1. Zero TypeScript compiler or lint errors.
2. 100% automated test passing rate on all PRs.
3. Sub-second API health check responses.
4. Clean demonstration of modular, production-ready full-stack architecture.

---

## 34. Interview Demo Flow

1. **Show Architecture:** Display monorepo layout, Prisma schema, and separation of concerns.
2. **Run Dev Environment:** Execute `docker compose up -d` and `npm run dev`.
3. **Verify API Health:** Query `GET /api/v1/health` to demonstrate Express, Helmet, CORS, and request ID tracking.
4. **Verify Database:** Run `npm run db:seed` and inspect database entities in Prisma Studio.
5. **Demonstrate Existing Prototype:** Upload a PDF resume, trigger client-side rasterization, and review ATS score gauge and breakdown.
6. **Execute Automated Tests:** Run Vitest and Playwright to prove test-driven reliability.
