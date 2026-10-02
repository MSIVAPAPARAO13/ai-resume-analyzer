# Resumind — Phase 4 Verification & Walkthrough: Job Intelligence + Resume/Job Matching

**Status:** Completed  
**Branch:** `feature/phase-4-job-intelligence`  
**Date:** 2026-10-02

---

## 1. Executive Summary

Phase 4 of **Resumind** implements **Job Intelligence + Explainable Resume/Job Matching**. This module enables candidates to save target job descriptions, deterministically parse them into structured **Job DNA**, extract explicit required and preferred qualifications, and evaluate alignment against their uploaded resumes and verified **Career Twin** ground truth.

Key achievements:

- **Zero External API Dependency:** Structured Job DNA parsing and candidate matching operate via deterministic algorithms and the existing provider abstraction (`AIProvider` / `MockAIProvider`). No external API keys or recurring LLM costs are required.
- **Strict Phase 4 Boundary:** Purposefully excluded Evidence Guard, automated AI tailoring, application CRM, interview generation, RAG, and microservices (scheduled for Phase 5+).
- **Tenant Isolation:** All Job, JobRequirement, JobAnalysis, and JobMatch records strictly enforce authenticated-user ownership across every Prisma query and REST endpoint.

---

## 2. Architecture & File Structure

```
apps/api/
├── prisma/
│   ├── schema.prisma                      # Job, JobRequirement, JobAnalysis, JobMatch models & enums
│   └── migrations/
│       └── 20261002030000_phase4_job_intelligence/ # Applied migration
├── src/
│   ├── modules/
│   │   └── job/
│   │       ├── job.validation.ts          # Zod schemas for jobs, Job DNA, and match results
│   │       ├── providers/
│   │       │   ├── job-provider.interface.ts # JobProvider contract for pluggable job sources
│   │       │   └── manual-job.provider.ts    # Manual paste job provider implementation
│   │       ├── parser/
│   │       │   ├── job-parser.interface.ts   # JobDescriptionParser contract
│   │       │   └── job-description.parser.ts # Deterministic Job DNA parser (role, skills, resp, etc.)
│   │       ├── matching/
│   │       │   ├── matching.interface.ts     # MatchingEngine & CareerTwinContext contracts
│   │       │   └── resume-job-matching.engine.ts # Explainable weighted matching engine (0-100)
│   │       ├── job.service.ts             # Orchestrates CRUD, Job DNA extraction, and match persistence
│   │       ├── job.controller.ts          # HTTP handlers with standard response envelopes
│   │       └── job.router.ts              # Route definitions mounted under /api/v1/jobs
│   └── app.ts                             # Mounts /api/v1/jobs
└── tests/
    ├── unit/
    │   └── job.test.ts                    # Unit tests for parser, Job DNA, and matching engine
    └── integration/
        └── job-intelligence.test.ts       # End-to-end API integration tests for CRUD, DNA, matching, isolation

apps/web/
├── app/
│   ├── lib/
│   │   └── api.ts                         # jobApi client methods
│   ├── routes.ts                          # Route registrations for /jobs, /jobs/new, /jobs/:id, etc.
│   └── routes/
│       ├── jobs.tsx                       # Target jobs dashboard & stats
│       ├── job-new.tsx                    # Add target job form with sample tech JD loader
│       ├── job-detail.tsx                 # Job details, resume selector, match launcher, match history
│       ├── job-analysis.tsx               # Visual Job DNA scorecard (Role, Skills, Responsibilities)
│       ├── job-match.tsx                  # Comprehensive match report, category breakdown, recommendations
│       └── dashboard.tsx                  # Dashboard with active Job Intelligence card & navigation
└── tests/
    └── unit/
        └── job.test.ts                    # Frontend unit tests for jobApi methods & match utilities

tests/
└── e2e/
    └── job-intelligence.spec.ts           # Playwright E2E critical user journey test
```

---

## 3. Database Design & Models

Extended the Prisma schema ([`apps/api/prisma/schema.prisma`](file:///c:/Users/msiva/WebstormProjects/ai-resume-analyzer/apps/api/prisma/schema.prisma)) with 4 models and 3 enums:

### Enums

- **`JobStatus`**: `SAVED`, `ANALYZED`, `ARCHIVED`
- **`RequirementType`**: `SKILL`, `RESPONSIBILITY`, `EXPERIENCE`, `EDUCATION`, `KEYWORD`
- **`RequirementImportance`**: `REQUIRED`, `PREFERRED`, `NICE_TO_HAVE`

### Models

1. **`Job`**:
   - `id` (UUID, Primary Key)
   - `userId` (UUID, Foreign Key -> `User.id` with `onDelete: Cascade`)
   - `title`, `company`, `location`, `employmentType`, `source` (default: "MANUAL"), `sourceUrl`
   - `description` (`@db.Text`, raw text of the posted JD)
   - `status` (`JobStatus`, default: `SAVED`)
   - Relations: `user`, `requirements`, `analyses`, `matches`
   - Indexes: `[userId]`, `[userId, status]`

2. **`JobRequirement`**:
   - `id` (UUID, Primary Key)
   - `jobId` (UUID, Foreign Key -> `Job.id` with `onDelete: Cascade`)
   - `type` (`RequirementType`)
   - `name` (String, e.g. "TypeScript", "3+ years experience", "Build REST APIs")
   - `importance` (`RequirementImportance`, default: `REQUIRED`)
   - `evidence` (String context extracted from the posting)
   - Indexes: `[jobId]`, `[jobId, type]`

3. **`JobAnalysis`**:
   - `id` (UUID, Primary Key)
   - `jobId` (UUID, Foreign Key -> `Job.id` with `onDelete: Cascade`)
   - `role`, `level`, `summary`, `experienceRequirement`, `educationRequirement`
   - `jobDna` (`Json`, validated by `jobDnaSchema`)
   - Indexes: `[jobId]`

4. **`JobMatch`**:
   - `id` (UUID, Primary Key)
   - `jobId` (UUID, Foreign Key -> `Job.id` with `onDelete: Cascade`)
   - `resumeVersionId` (UUID, Foreign Key -> `ResumeVersion.id` with `onDelete: Cascade`)
   - `overallScore`, `skillsScore`, `experienceScore`, `responsibilitiesScore`, `educationScore`, `keywordScore`, `careerTwinScore` (all 0-100 integers)
   - `result` (`Json`, complete match report validated by `matchResultSchema`)
   - Indexes: `[jobId]`, `[resumeVersionId]`

---

## 4. Job DNA & Description Parsing

The [`DeterministicJobDescriptionParser`](file:///c:/Users/msiva/WebstormProjects/ai-resume-analyzer/apps/api/src/modules/job/parser/job-description.parser.ts) converts raw job description text into structured **Job DNA**:

1. **Role & Role Family:**
   - Detects engineering specialization (e.g. _Backend Engineering, Frontend Engineering, Full Stack Engineering, DevOps & Cloud, Data & AI, Mobile, Security_). Title carries primary precedence over body text to prevent false classifications.
2. **Seniority Level:**
   - Identifies candidate seniority (_Intern, Entry / Junior, Mid-Level, Senior, Staff / Lead, Principal / Architect, Management_).
3. **Required vs Preferred Skills Isolation:**
   - Header boundary detection routes skills into `requiredSkills` vs `preferredSkills`.
   - Responsibilities lines are guarded from polluting required qualification lists.
   - Comprehensive technical taxonomy covers languages, web frameworks, backend runtimes, databases, cloud platforms, and testing libraries.
4. **Responsibilities:**
   - Extracts action-oriented duties and project tasks, normalizing bullets, numbers, and whitespace.
5. **Experience & Education:**
   - Regex patterns identify minimum year thresholds (`(\d+)\+?\s*years`) and degree levels (_Bachelor's, Master's, PhD_).
6. **Domain Keywords:**
   - Extracts architecture and domain keywords (_Microservices, REST, CI/CD, Distributed Systems, Scalability_).

---

## 5. Resume ↔ Job Matching Engine & Scoring Methodology

The [`ResumeJobMatchingEngine`](file:///c:/Users/msiva/WebstormProjects/ai-resume-analyzer/apps/api/src/modules/job/matching/resume-job-matching.engine.ts) computes an explainable, deterministic match score ($0 \le \text{Score} \le 100$) across 6 categories:

$$\text{Overall Match Score} = \text{round}\left(\sum_{i} \text{CategoryScore}_i \times \text{Weight}_i\right)$$

| Category                   | Weight  | Evaluation Criteria                                                                                                                                                 |
| :------------------------- | :-----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Skills Match**           | **30%** | Required skills carry 75% category weight; preferred skills carry 25%. Supported by alias mapping (_React/React.js, PostgreSQL/Postgres, AWS/Amazon Web Services_). |
| **Experience Match**       | **20%** | Total verified years across work histories compared against JD threshold. Full tenure earns 100%; partial scaled linearly.                                          |
| **Responsibilities Match** | **20%** | Semantic overlap and action-verb alignment between candidate achievements and core job duties.                                                                      |
| **Education Match**        | **10%** | Degree level (BS, MS, PhD) and field alignment. Practical experience provides credit.                                                                               |
| **Keywords Coverage**      | **10%** | Density and presence of architectural, cloud, and domain keywords in candidate text.                                                                                |
| **Career Twin Alignment**  | **10%** | Rewards candidate for verified Career Twin evidence (skills, verified projects, and work history) even if concise on a one-page resume.                             |

### Match Classifications

- **`Strong Match`**: Clear supporting evidence found in resume or verified Career Twin.
- **`Partial Match`**: Related experience detected with transparent explanation of the remaining gap.
- **`Missing`**: Requirement not found. Accompanied by constructive, neutral guidance (e.g. _"Missing: Docker (Preferred). If you have container experience not yet in your Career Twin, add it to your profile."_).
- **Non-Accusatory Tone**: Grounded in objective fact; missing items are never labeled "fake".

---

## 6. REST API Reference

All routes require authentication (`Authorization: Bearer <token>`) and enforce user isolation:

| Method   | Endpoint                               | Description                                           |
| :------- | :------------------------------------- | :---------------------------------------------------- |
| `POST`   | `/api/v1/jobs`                         | Save a new target Job Description                     |
| `GET`    | `/api/v1/jobs`                         | List all saved jobs for authenticated user            |
| `GET`    | `/api/v1/jobs/:id`                     | Fetch job details, latest analysis, and matches       |
| `PUT`    | `/api/v1/jobs/:id`                     | Update job information                                |
| `DELETE` | `/api/v1/jobs/:id`                     | Delete job (cascades requirements, analyses, matches) |
| `POST`   | `/api/v1/jobs/:id/analyze`             | Parse Job Description into structured Job DNA         |
| `GET`    | `/api/v1/jobs/:id/analysis`            | Fetch structured Job DNA                              |
| `POST`   | `/api/v1/jobs/:jobId/match/:resumeId`  | Run matching engine against selected resume version   |
| `GET`    | `/api/v1/jobs/:jobId/matches`          | List all matches evaluated for this job               |
| `GET`    | `/api/v1/jobs/:jobId/matches/:matchId` | Fetch detailed match report                           |

---

## 7. Frontend User Experience

- **Jobs Dashboard ([`/jobs`](file:///c:/Users/msiva/WebstormProjects/ai-resume-analyzer/apps/web/app/routes/jobs.tsx))**:
  - Displays target jobs, status badges (`SAVED`, `ANALYZED`), and latest match score gauge.
  - Action buttons: _View Job DNA_, _Match Resume_, _Delete_.
- **Add Job Form ([`/jobs/new`](file:///c:/Users/msiva/WebstormProjects/ai-resume-analyzer/apps/web/app/routes/job-new.tsx))**:
  - Inputs for title, company, location, employment type, source URL, and description text.
  - _Load Sample Tech JD_ shortcut button for rapid testing.
- **Job Details & Resume Matcher ([`/jobs/:id`](file:///c:/Users/msiva/WebstormProjects/ai-resume-analyzer/apps/web/app/routes/job-detail.tsx))**:
  - Dropdown selector of candidate's uploaded resumes.
  - One-click _Run Match Analysis ⚡_ execution.
  - History list of previous matches with overall score badges.
- **Job DNA Visualizer ([`/jobs/:id/analysis`](file:///c:/Users/msiva/WebstormProjects/ai-resume-analyzer/apps/web/app/routes/job-analysis.tsx))**:
  - Role overview, role family, and level badges.
  - Required skills and preferred skills badge lists.
  - Experience and education expectations cards.
  - Core responsibilities list and keyword pills.
- **Match Scorecard Dashboard ([`/jobs/:id/match/:matchId`](file:///c:/Users/msiva/WebstormProjects/ai-resume-analyzer/apps/web/app/routes/job-match.tsx))**:
  - Large overall match score gauge with match tier rating.
  - 6 category breakdown bars.
  - Strong matches with verified evidence snippets.
  - Partial matches with identified gaps.
  - Missing requirements with constructive next steps.
  - Actionable preparation recommendations.

---

## 8. Quality & Verification Summary

- **TypeScript (`npm run typecheck`)**: 0 errors across `@resumind/web` and `@resumind/api`.
- **ESLint (`npm run lint`)**: 0 errors, 0 warnings.
- **Prettier (`npm run format:check`)**: 100% matched code style.
- **Production Builds (`npm run build:web`, `npm run build:api`)**:
  - Client bundle (820 modules) and server SSR bundles build cleanly.
  - API TypeScript build compiles cleanly to `dist/`.
- **Unit Tests**:
  - Web unit tests: **9 passed** (`smoke.test.ts`, `job.test.ts`, `resume.test.ts`).
  - API unit tests: **9 passed** (`apps/api/tests/unit/job.test.ts`).
- **E2E Playwright**: Created [`tests/e2e/job-intelligence.spec.ts`](file:///c:/Users/msiva/WebstormProjects/ai-resume-analyzer/tests/e2e/job-intelligence.spec.ts) testing the complete critical path: Registration -> Upload Resume -> Save Job -> Extract Job DNA -> Match Resume -> Verify Scores & Breakdown -> Refresh Persistence.

---

## 9. Known Limitations & Next Steps (Phase 5)

- **AI Parsing Enhancement**: Phase 4 uses the deterministic parser and `MockAIProvider`. Phase 5 will introduce Gemini API integration for zero-shot nuance extraction.
- **Evidence Guard**: Scheduled for Phase 5 to actively guard against hallucinations before resume tailoring.
- **Application CRM & Tailoring**: Scheduled for Phase 5 & 6.
