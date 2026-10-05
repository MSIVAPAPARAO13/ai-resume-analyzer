# Phase 8 — Career Analytics, Skill Gap Analysis & Learning Plan

Resumind Career & Resume Optimization SaaS  
**Branch:** `feature/phase-8-career-analytics-learning`  
**Status:** COMPLETE

---

## 1. Executive Summary & Objective

Phase 8 builds an explainable, data-grounded career intelligence and progression system for candidates. It answers:

1. What skills does the candidate currently have?
2. How strong and diverse is the evidence backing each skill?
3. Which skills are frequently required by target jobs?
4. Which important skills are missing or weak?
5. Which skills should the user prioritize (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)?
6. What learning activities and proof-of-work tasks should the user execute?
7. Is the candidate's skill profile and career readiness improving over time?

Crucially, Resumind adheres strictly to the **Evidence Guard** hierarchy:

```
VERIFIED_USER_DATA (Career Twin)
        ↓
Approved GitHub Imports
        ↓
Resume Mentions (Needs Review)
        ↓
External Job Requirements (Job DNA)
        ↓
AI Grounded Recommendations
```

Resumind **never fabricates** credentials, skills, courses, or industry statistics. Completing tasks in a learning plan builds proof-of-work (e.g. GitHub repos, configs), which the candidate then reviews and imports into their Career Twin.

---

## 2. Architecture & Design Principles

### Modular Monolith Integration

- **Backend:** Express + TypeScript (`apps/api/src/modules/analytics`, `apps/api/src/modules/learning`)
- **Database:** Prisma + PostgreSQL (`apps/api/prisma/schema.prisma`)
  - Enums: `LearningPlanStatus`, `SkillPriority`, `GoalTaskStatus`
  - Models: `LearningPlan`, `LearningGoal`, `LearningTask`, `CareerSnapshot`
- **Frontend:** React + React Router + Bootstrap 5 (`apps/web/app/routes/analytics*`, `apps/web/app/routes/learning*`). **Strictly NO Tailwind CSS.**
- **AI Providers:** `MockAIProvider` (deterministic unit & integration tests), `GeminiProvider` (Google GenAI with structured Zod outputs).

---

## 3. Skill Normalization & Strength Engine

### Alias Resolver (`SkillNormalizer`)

Candidate inputs and job descriptions often use aliases. Resumind normalizes these to canonical skill names while preserving original candidate wording:

- `React.js`, `reactjs` → `React` (Category: Frontend Frameworks)
- `Postgres`, `postgres` → `PostgreSQL` (Category: Databases)
- `Node`, `nodejs` → `Node.js` (Category: Backend Frameworks)
- `JS` → `JavaScript`, `TS` → `TypeScript`
- `K8s` → `Kubernetes`

### Explainable Strength Classification

Skill strength is computed from verified evidence items:

- **`STRONG`**: Skill present in Career Twin AND reinforced by 2+ verified projects/experience entries or approved GitHub repositories.
- **`MODERATE`**: Skill present in Career Twin with at least 1 project/experience mention, or present in 2+ independent sources.
- **`WEAK`**: Single mention (e.g. unverified resume text).
- **`UNKNOWN`**: Skill declared without supporting context.

### Verification Status

- `VERIFIED_USER_DATA`: Entered in Career Twin or approved work experiences/projects.
- `EXTERNAL_SOURCE`: Approved GitHub repositories with matched language/topics.
- `NEEDS_REVIEW`: Extracted from parsed resume versions without Career Twin presence.
- `UNSUPPORTED`: External job requirement not present in user profile.

---

## 4. Explainable Career Readiness Score (0–100)

Resumind does **not** claim to predict real-world hiring outcomes. Instead, it provides an explainable **Career Readiness Score** composed of 5 distinct dimensions:

$$\text{Overall Score} = \text{Skill Alignment} \times 0.35 + \text{Resume Readiness} \times 0.20 + \text{Evidence Strength} \times 0.20 + \text{Interview Readiness} \times 0.15 + \text{Twin Completeness} \times 0.10$$

1. **Skill Alignment (0–100):** Coverage of required vs. preferred target job skills.
2. **Resume Readiness (0–100):** Score of the candidate's latest resume version.
3. **Evidence Strength (0–100):** Ratio of verified user data items to total declared skills.
4. **Interview Readiness (0–100):** Evaluated performance across interview practice sessions and mock questions.
5. **Career Twin Completeness (0–100):** Completeness of candidate profile (experience, projects, skills, education).

---

## 5. Skill Gap & Priority Engine

The Skill Gap Engine compares candidate normalized skills against:

- Target Role & Target Seniority Level
- Saved/Imported Job DNA requirements
- Historical match records

### Priority Classification:

- **`CRITICAL`**: Required by target jobs and currently `MISSING` from user profile.
- **`HIGH`**: Required by target jobs and currently `WEAK`/`PARTIAL`.
- **`MEDIUM`**: Preferred skill with moderate market frequency.
- **`LOW`**: Optional or niche skill.

_Zero fake data guarantee:_ If no target jobs exist in the system, Resumind states `"Insufficient job data"` rather than fabricating percentages.

---

## 6. Evidence-Building Learning Plan Engine

Resumind differentiates from generic course aggregators by focusing on **proof-of-work evidence building**:

```
Skill Gap
   ↓
Learning Objective
   ↓
Suggested Practice
   ↓
Evidence-Building Task (Repository / Architecture Doc / Config)
   ↓
Candidate Reviews & Imports to Career Twin
   ↓
Skill Verification & Strength Updated
```

### Models & Schema:

- **`LearningPlan`**: `id`, `userId`, `title`, `targetRole`, `status` (`DRAFT`, `ACTIVE`, `COMPLETED`, `PAUSED`, `ARCHIVED`), `targetDate`, timestamps.
- **`LearningGoal`**: `id`, `planId`, `skill`, `canonicalSkill`, `priority` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), `currentLevel`, `targetLevel`, `status` (`TODO`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`), `rationale`.
- **`LearningTask`**: `id`, `goalId`, `title`, `description`, `type` (`PRACTICE`, `PROJECT`, `EVIDENCE`, `READING`, `REVIEW`), `status`, `dueDate`, `completedAt`, `evidenceReference`.
- **`CareerSnapshot`**: `id`, `userId`, `careerReadinessScore`, `skillCoverageScore`, `evidenceCoverageScore`, `metrics` (JSON), `createdAt`.

---

## 7. API Endpoints

### Analytics APIs (`/api/v1/analytics`)

| Method | Endpoint                          | Description                                                                    |
| ------ | --------------------------------- | ------------------------------------------------------------------------------ |
| `GET`  | `/api/v1/analytics/overview`      | Composite dashboard: career readiness, top gaps, active learning, insights     |
| `GET`  | `/api/v1/analytics/skills`        | Normalized candidate skill profile with strengths & verification status        |
| `GET`  | `/api/v1/analytics/skills/gaps`   | Identified skill gaps with priority, required evidence, and next actions       |
| `GET`  | `/api/v1/analytics/skills/:skill` | Detail view of specific canonical skill and evidence items                     |
| `GET`  | `/api/v1/analytics/roles`         | Target role alignment, top required skills, strong/partial/missing breakdown   |
| `GET`  | `/api/v1/analytics/jobs`          | Real market demand aggregated from stored Job DNA (no fake stats)              |
| `GET`  | `/api/v1/analytics/applications`  | Application CRM performance (interview rate, offer rate, resume version stats) |
| `GET`  | `/api/v1/analytics/interviews`    | Interview preparation readiness, technical vs behavioral strengths             |
| `GET`  | `/api/v1/analytics/resumes`       | Resume versions performance comparison                                         |
| `GET`  | `/api/v1/analytics/evidence`      | Evidence coverage matrix by source and verification status                     |
| `GET`  | `/api/v1/analytics/progress`      | Historical snapshot trends                                                     |
| `POST` | `/api/v1/analytics/snapshots`     | Capture current career progress snapshot                                       |

### Learning Plan APIs (`/api/v1/learning-plans`)

| Method   | Endpoint                              | Description                                                  |
| -------- | ------------------------------------- | ------------------------------------------------------------ |
| `POST`   | `/api/v1/learning-plans`              | Create a new learning plan                                   |
| `GET`    | `/api/v1/learning-plans`              | List user's learning plans                                   |
| `GET`    | `/api/v1/learning-plans/:id`          | Get plan details with goals and tasks                        |
| `PATCH`  | `/api/v1/learning-plans/:id`          | Update plan title, status, or dates                          |
| `DELETE` | `/api/v1/learning-plans/:id`          | Delete plan and associated goals/tasks                       |
| `POST`   | `/api/v1/learning-plans/:id/generate` | Auto-generate goals & evidence tasks from profile skill gaps |
| `GET`    | `/api/v1/learning-plans/:id/goals`    | List goals for plan                                          |
| `POST`   | `/api/v1/learning-plans/:id/goals`    | Add custom goal to plan                                      |
| `PATCH`  | `/api/v1/learning-goals/:id`          | Update goal status or level                                  |
| `POST`   | `/api/v1/learning-tasks`              | Add task to goal                                             |
| `PATCH`  | `/api/v1/learning-tasks/:id`          | Update task status (TODO, IN_PROGRESS, COMPLETED, SKIPPED)   |
| `DELETE` | `/api/v1/learning-tasks/:id`          | Delete task                                                  |
| `POST`   | `/api/v1/learning-plans/:id/complete` | Mark entire plan as completed                                |

---

## 8. Frontend Implementation

All views are built in **Bootstrap 5** with accessible markup, clean cards, dark theme harmony, and responsive layouts:

- `/analytics`: Overview dashboard featuring Explainable Readiness Index, score cards, actionable insights, top gaps preview.
- `/analytics/skills`: Interactive skill intelligence tab & gap priority filter.
- `/analytics/roles`: Target role alignment cards (strong, partial, missing skills, why it matters).
- `/analytics/applications`: Conversion funnel metrics and resume version performance.
- `/analytics/interviews`: Multi-dimensional readiness progress (technical, behavioral, resume, job-specific).
- `/analytics/evidence`: Evidence verification matrix (`VERIFIED_USER_DATA`, `EXTERNAL_SOURCE`, `NEEDS_REVIEW`).
- `/learning`: Learning roadmap directory with progress bars.
- `/learning/new`: Roadmap creation form with option to auto-generate from skill gaps.
- `/learning/:id`: Detailed roadmap view with interactive task checkboxes, modals for adding goals/tasks, and Evidence Guard reminder banners.

---

## 9. Security & Tenant Isolation

- **Authentication:** All endpoints require signed JWT Bearer tokens.
- **Strict User Isolation:** All queries filter by `userId`. User B cannot read or modify User A's learning plans, tasks, goals, snapshots, or analytics (enforced with 404/403 responses).
- **Zero Secret Leakage:** Analytics payloads sanitize all credentials, hashes, and OAuth tokens.
- **Zod Validation:** All incoming payloads and AI structured responses are strictly validated.

---

## 10. Verification & Test Results

- **Prisma Schema Validation:** Validated and migration generated (`20261005160000_phase8_career_analytics_learning`).
- **Root Typecheck (`npm run typecheck`):** PASSED (0 errors in `@resumind/api` and `@resumind/web`).
- **Unit & Integration Tests (`vitest run`):** 19 tests passed in `apps/api/tests/integration/phase8-career-analytics-learning.test.ts`.
- **E2E Tests (`tests/e2e/phase8-career-analytics-learning.spec.ts`):** Created covering all 4 journeys.
