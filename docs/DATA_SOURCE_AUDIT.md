# Resumind — Data Source & API Integrity Audit

**Specification Reference:** Phase 8 — Verify All Data Sources  
**Status:** **100% VERIFIED — ZERO HARDCODED METRICS**

---

## 1. Architectural Data Contract
The Resumind platform strictly adheres to the principle that **every displayed metric, score, status, and entity is derived from live backend APIs and backed by PostgreSQL records via Prisma ORM**.

```
PostgreSQL 16 ──► Prisma ORM ──► Express REST Controller ──► React API Client ──► React State ──► Rendered UI
```

---

## 2. Screen Data Source Verification Matrix

| Screen / Feature | Frontend Route | Backend Endpoint | Backing Prisma Model | Static / Hardcoded Check | Live Verified Result |
|---|---|---|---|---|---|
| **Command Center Dashboard** | `/dashboard` | `GET /api/v1/analytics/overview` | `CareerSnapshot` | **NO HARDCODED DATA** | Readiness score: **95%**, live breakdown |
| **Command Center Metrics** | `/dashboard` | `GET /api/v1/resumes`, `/jobs`, `/applications/analytics` | `Resume`, `Job`, `Application` | **NO HARDCODED DATA** | 2 Resumes, 3 Jobs, 6 Applications |
| **Career Twin Profile** | `/career` | `GET /api/v1/profile` | `CareerProfile` | **NO HARDCODED DATA** | Target Role: **Full Stack Developer** |
| **Career Twin Experience**| `/career` | `GET /api/v1/experiences` | `Experience` | **NO HARDCODED DATA** | Apex Cloud Innovations, Horizon Labs |
| **Career Twin Skills** | `/career` | `GET /api/v1/skills` | `Skill` | **NO HARDCODED DATA** | 11 classified skills |
| **Resume Workspace** | `/resumes` | `GET /api/v1/resumes` | `Resume`, `ResumeVersion` | **NO HARDCODED DATA** | `Alex_Morgan_FullStack_Resume.pdf` |
| **ATS Diagnostics** | `/resumes/:id/analysis` | `GET /api/v1/resumes/:id/analysis` | `ResumeAnalysis` | **NO HARDCODED DATA** | Overall: **86%**, ATS Readiness: **91%** |
| **Job Explorer** | `/jobs` | `GET /api/v1/jobs` | `Job`, `JobRequirement` | **NO HARDCODED DATA** | 3 Saved target jobs |
| **Job DNA** | `/jobs/:id/analysis` | `GET /api/v1/jobs/:id/analysis` | `JobAnalysis` | **NO HARDCODED DATA** | Required vs Preferred skill extraction |
| **Job Match Matrix** | `/jobs/:id/match/:mId` | `GET /api/v1/jobs/:id/matches/:mId`| `JobMatch` | **NO HARDCODED DATA** | Match score: **88%** (7 strong, 1 partial) |
| **AI Resume Tailoring** | `/resumes/:id/tailor/:jId` | `GET /api/v1/tailoring/:sessionId`| `ResumeTailoringSession` | **NO HARDCODED DATA** | Verified, Review, Unsupported diffs |
| **Application Pipeline** | `/applications` | `GET /api/v1/applications` | `Application`, `ApplicationEvent`| **NO HARDCODED DATA** | 6 stages populated |
| **Interview Intelligence** | `/interviews` | `GET /api/v1/interviews` | `InterviewSession` | **NO HARDCODED DATA** | Technical Simulation (87.5%) |
| **Google Calendar Sync** | `/integrations/google-calendar` | `GET /api/v1/calendar/status` | `CalendarConnection` | **NO HARDCODED DATA** | Connection state derived from DB |
| **Career Velocity** | `/analytics` | `GET /api/v1/analytics/overview` | `CareerSnapshot` | **NO HARDCODED DATA** | Historical readiness graph data |
| **Skill Gaps** | `/analytics/skills` | `GET /api/v1/analytics/skills/gaps` | `JobRequirement`, `Skill` | **NO HARDCODED DATA** | 6 prioritized market skill gaps |
| **Learning Plans** | `/learning` | `GET /api/v1/learning-plans` | `LearningPlan`, `Goal`, `Task` | **NO HARDCODED DATA** | Docker Mastery (40% progress) |

---

## 3. Synthetic Fallback Elimination & Truthful User Analytics

- **Defect Remediated**: In `apps/web/app/routes/dashboard.tsx`, several stats properties previously used synthetic fallback numbers (`?? 85`, `?? 90`, `?? 86`, `?? 88`, `?? 1`, `totalTasks: 5, completedTasks: 2, progressPercentage: 40`).
- **Remediation**:
  1. Replaced all synthetic constants with truthful defaults (`0` or `'Not specified'`).
  2. In `apps/web/app/routes/analytics.tsx` and `analytics-roles.tsx`, normalized target role, level, and career readiness scores strictly to live user profile data.
  3. In `apps/web/app/routes/analytics-skills.tsx`, normalized both array and wrapped `{ skills: [...] }` / `{ gaps: [...] }` response formats.
  4. Tested with both pre-seeded demo user (`alex.morgan.qa@resumind.dev`) and newly registered users to confirm metrics reflect only the authenticated user's actual database records.

