# RESUMIND — FRONTEND API TO SCREEN MAPPING SPECIFICATION

**Document Version:** 1.0.0  
**Status:** Approved Architecture Source of Truth  
**Target Platform:** React 19 + TypeScript + React Router v7 + Bootstrap 5  
**Backend Architecture:** Express + TypeScript + Prisma ORM + PostgreSQL + Redis

---

## 1. Executive Summary & Mapping Principles

This document defines the strict, 1-to-1 contractual mapping between the Resumind Express REST API (`/api/v1/*`) and the frontend user interfaces. Resumind is an **Evidence-First AI Career Operating System**.

### Core Constraints & Rules:

1. **Source of Truth:** The backend routes and Prisma schemas are canonical. No frontend screen may invent fictitious REST endpoints or query parameters.
2. **Evidence Guard Contract:** Any AI suggestion, match insight, or tailoring diff must reflect backend `EvidenceGuardStatus` (`VERIFIED`, `NEEDS_REVIEW`, `UNSUPPORTED`).
3. **No Destructive Overwrites:** AI tailoring creates discrete `ResumeVersion` instances linked to `TailoringSession`; it never mutates source resumes in place.
4. **Tenant Isolation:** All requests leverage JWT bearer authentication in `Authorization: Bearer <accessToken>` headers. The API scopes all DB operations to `req.user.id`.
5. **Support Classification:**
   - **`SUPPORTED`**: Fully implemented end-to-end (Backend Controller + Service + Prisma + Frontend Client).
   - **`PARTIALLY SUPPORTED`**: Backend endpoints exist and frontend client exists, but UI lacks full visual polish, deep state handling, or dedicated sub-views.
   - **`NOT CURRENTLY SUPPORTED`**: Proposed UI features that do not possess backing Express controllers or Prisma tables.

---

## 2. Global Module API-to-Screen Matrix

| Frontend Screen                     | Route                           | API Endpoint                                           | HTTP Method              | Module / Controller      | Purpose & Data Contract                                                             | UI Action / Trigger                                  | Support Status            |
| ----------------------------------- | ------------------------------- | ------------------------------------------------------ | ------------------------ | ------------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------- |
| **Landing Page**                    | `/`                             | _None (Public static/marketing)_                       | N/A                      | Marketing / Home         | Product overview, feature showcase, CTA to register/login                           | Click "Get Started", "Sign In"                       | `SUPPORTED`               |
| **Login**                           | `/login`                        | `/api/v1/auth/login`                                   | `POST`                   | `auth.controller`        | Authenticates user with `{ email, password }`, returns JWT access & refresh tokens  | Form submit, redirects to `/dashboard`               | `SUPPORTED`               |
| **Register**                        | `/register`                     | `/api/v1/auth/register`                                | `POST`                   | `auth.controller`        | Creates account with `{ email, password, name? }`, issues tokens                    | Form submit, auto-logs in and redirects to `/career` | `SUPPORTED`               |
| **Auth Session / Me**               | _Global (All)_                  | `/api/v1/auth/me`                                      | `GET`                    | `auth.controller`        | Fetches authenticated user profile `{ id, email, name, role }`                      | App mount, auth state verification                   | `SUPPORTED`               |
| **Token Refresh**                   | _Global Interceptor_            | `/api/v1/auth/refresh`                                 | `POST`                   | `auth.controller`        | Exchanges `{ refreshToken }` for new token pair                                     | Automatic Axios 401 interceptor                      | `SUPPORTED`               |
| **Logout**                          | _Global (Navbar)_               | `/api/v1/auth/logout`                                  | `POST`                   | `auth.controller`        | Revokes refresh token in database                                                   | Click "Sign Out", clears localStorage                | `SUPPORTED`               |
| **Forgot Password**                 | `/forgot-password`              | _None_                                                 | N/A                      | _Auth_                   | Password recovery workflow                                                          | _Not implemented in API_                             | `NOT CURRENTLY SUPPORTED` |
| **Dashboard**                       | `/dashboard`                    | `/api/v1/analytics/overview`                           | `GET`                    | `analytics.controller`   | Career readiness score (0-100), metric summaries, breakdown                         | Page load                                            | `SUPPORTED`               |
| **Dashboard (Resumes)**             | `/dashboard`                    | `/api/v1/resumes`                                      | `GET`                    | `resume.controller`      | Fetches latest resume and ATS score for dashboard card                              | Page load                                            | `SUPPORTED`               |
| **Dashboard (Jobs)**                | `/dashboard`                    | `/api/v1/jobs`                                         | `GET`                    | `job.controller`         | Fetches active jobs & match status for dashboard card                               | Page load                                            | `SUPPORTED`               |
| **Dashboard (Apps)**                | `/dashboard`                    | `/api/v1/applications/analytics`                       | `GET`                    | `application.controller` | Fetches application pipeline counts (Saved, Applied, Interviews, Offers)            | Page load                                            | `SUPPORTED`               |
| **Career Twin - Profile**           | `/career`                       | `/api/v1/profile`                                      | `GET`, `PUT`             | `career.controller`      | Fetches and updates user Career Twin baseline (headline, bio, location, targetRole) | Form save button                                     | `SUPPORTED`               |
| **Career Twin - Experiences**       | `/career`                       | `/api/v1/experiences`                                  | `GET`, `POST`            | `career.controller`      | Lists experiences; creates new experience record                                    | Load list, "Add Experience" modal                    | `SUPPORTED`               |
| **Career Twin - Experience Item**   | `/career`                       | `/api/v1/experiences/:id`                              | `PUT`, `DELETE`          | `career.controller`      | Updates or deletes existing work experience                                         | "Edit", "Delete" buttons                             | `SUPPORTED`               |
| **Career Twin - Education**         | `/career`                       | `/api/v1/education`                                    | `GET`, `POST`            | `career.controller`      | Lists education; creates new institution/degree entry                               | Load list, "Add Education" modal                     | `SUPPORTED`               |
| **Career Twin - Education Item**    | `/career`                       | `/api/v1/education/:id`                                | `PUT`, `DELETE`          | `career.controller`      | Updates or deletes existing education entry                                         | "Edit", "Delete" buttons                             | `SUPPORTED`               |
| **Career Twin - Projects**          | `/career`                       | `/api/v1/projects`                                     | `GET`, `POST`            | `career.controller`      | Lists projects with technologies & evidence links; creates new                      | Load list, "Add Project" modal                       | `SUPPORTED`               |
| **Career Twin - Project Item**      | `/career`                       | `/api/v1/projects/:id`                                 | `PUT`, `DELETE`          | `career.controller`      | Updates or deletes project portfolio entry                                          | "Edit", "Delete" buttons                             | `SUPPORTED`               |
| **Career Twin - Skills**            | `/career`                       | `/api/v1/skills`                                       | `GET`, `POST`            | `career.controller`      | Lists classified skills (Languages, Tools, etc.); creates skill                     | Load list, "Add Skill" tag                           | `SUPPORTED`               |
| **Career Twin - Skill Item**        | `/career`                       | `/api/v1/skills/:id`                                   | `PUT`, `DELETE`          | `career.controller`      | Updates proficiency/category or removes skill                                       | "Update Level", "Remove"                             | `SUPPORTED`               |
| **Career Twin - Certifications**    | `/career`                       | `/api/v1/certifications`                               | `GET`, `POST`            | `career.controller`      | Lists certificates; creates new certification record                                | Load list, "Add Certification"                       | `SUPPORTED`               |
| **Career Twin - Cert Item**         | `/career`                       | `/api/v1/certifications/:id`                           | `PUT`, `DELETE`          | `career.controller`      | Updates or deletes certification                                                    | "Edit", "Delete"                                     | `SUPPORTED`               |
| **Career Twin - Achievements**      | `/career`                       | `/api/v1/achievements`                                 | `GET`, `POST`            | `career.controller`      | Lists awards, honors, publications; creates achievement                             | Load list, "Add Achievement"                         | `SUPPORTED`               |
| **Career Twin - Achieve Item**      | `/career`                       | `/api/v1/achievements/:id`                             | `PUT`, `DELETE`          | `career.controller`      | Updates or deletes achievement                                                      | "Edit", "Delete"                                     | `SUPPORTED`               |
| **Resumes Workspace**               | `/resumes`                      | `/api/v1/resumes`                                      | `GET`                    | `resume.controller`      | Lists all user resumes with metadata, score, ATS readiness                          | Page load                                            | `SUPPORTED`               |
| **Resume Upload**                   | `/resumes`                      | `/api/v1/resumes`                                      | `POST` (multipart)       | `resume.controller`      | Uploads PDF/DOCX/TXT resume, parses text, stores record                             | Drag-and-drop or file selector                       | `SUPPORTED`               |
| **Resume Detail**                   | `/resumes/:id`                  | `/api/v1/resumes/:id`                                  | `GET`, `DELETE`          | `resume.controller`      | Retrieves resume content, current score, parsed sections                            | Page load, "Delete Resume"                           | `SUPPORTED`               |
| **Resume Version History**          | `/resumes/:id`                  | `/api/v1/resumes/:id/versions`                         | `GET`                    | `resume.controller`      | Lists all tailored versions derived from base resume                                | Version history panel/tab                            | `SUPPORTED`               |
| **Resume Version Detail**           | `/resumes/:id`                  | `/api/v1/resumes/:id/versions/:vId`                    | `GET`                    | `resume.controller`      | Retrieves specific tailored version content & score                                 | Version selection click                              | `SUPPORTED`               |
| **Resume AI Analysis Trigger**      | `/resumes/:id`                  | `/api/v1/resumes/:id/analyze`                          | `POST`                   | `resume.controller`      | Triggers Gemini ATS analysis, section scores, recommendations                       | Click "Analyze Resume"                               | `SUPPORTED`               |
| **Resume Analysis View**            | `/resumes/:id/analysis`         | `/api/v1/resumes/:id/analysis`                         | `GET`                    | `resume.controller`      | Fetches cached Gemini analysis, scores, strengths, weaknesses                       | Page load                                            | `SUPPORTED`               |
| **Job Explorer / List**             | `/jobs`                         | `/api/v1/jobs`                                         | `GET`, `POST`            | `job.controller`         | Lists saved jobs; manually creates a new target job description                     | Page load, "Add Job" button                          | `SUPPORTED`               |
| **Job Detail**                      | `/jobs/:id`                     | `/api/v1/jobs/:id`                                     | `GET`, `PUT`, `DELETE`   | `job.controller`         | Retrieves job description, metadata, requirements                                   | Page load, "Edit", "Delete"                          | `SUPPORTED`               |
| **Job DNA Analysis Trigger**        | `/jobs/:id`                     | `/api/v1/jobs/:id/analyze`                             | `POST`                   | `job.controller`         | Extracts skills, seniority, experience requirements (Gemini)                        | Click "Extract Job DNA"                              | `SUPPORTED`               |
| **Job DNA View**                    | `/jobs/:id/analysis`            | `/api/v1/jobs/:id/analysis`                            | `GET`                    | `job.controller`         | Displays Job DNA (skills, role requirements, keywords)                              | Page load                                            | `SUPPORTED`               |
| **Job Match List**                  | `/jobs/:id`                     | `/api/v1/jobs/:id/matches`                             | `GET`                    | `job.controller`         | Lists all match evaluations between this job & user resumes                         | Matches tab on Job Detail                            | `SUPPORTED`               |
| **Job Match Evaluation**            | `/jobs/:id`                     | `/api/v1/jobs/:id/match/:resumeId`                     | `POST`                   | `job.controller`         | Runs semantic match algorithm comparing Resume to Job                               | Click "Calculate Match"                              | `SUPPORTED`               |
| **Job Match Matrix View**           | `/jobs/:id/match/:matchId`      | `/api/v1/jobs/:id/matches/:matchId`                    | `GET`                    | `job.controller`         | Returns full match matrix: strong, partial, missing skills, score                   | Page load                                            | `SUPPORTED`               |
| **Adzuna Job Discovery**            | `/jobs/search`                  | `/api/v1/job-search`                                   | `GET`                    | `job-search.controller`  | Queries live Adzuna API for job listings by title, location, category               | Search form submit                                   | `SUPPORTED`               |
| **Adzuna Job Import**               | `/jobs/search`                  | `/api/v1/job-search/import`                            | `POST`                   | `job-search.controller`  | Imports selected Adzuna job into user's saved Job repository                        | Click "Import to Resumind"                           | `SUPPORTED`               |
| **Salary Benchmark**                | `/jobs/search`                  | `/api/v1/job-search/salary-estimate`                   | `GET`                    | `job-search.controller`  | Fetches salary range benchmarks for given role & location                           | Filter change / Benchmark button                     | `SUPPORTED`               |
| **Tailoring Session Trigger**       | `/resumes/:id/tailor/:jobId`    | `/api/v1/resumes/:id/tailor/:jobId`                    | `POST`                   | `resume.controller`      | Generates AI resume tailoring suggestions with Evidence Guard                       | Click "Generate Tailoring"                           | `SUPPORTED`               |
| **Tailoring Session View**          | `/resumes/:id/tailor/:jobId`    | `/api/v1/tailoring/:sessionId`                         | `GET`                    | `resume.controller`      | Retrieves active tailoring session, suggestions, and review status                  | Page load / Session restore                          | `SUPPORTED`               |
| **Accept Tailoring Suggestion**     | `/resumes/:id/tailor/:jobId`    | `/api/v1/tailoring/:sessionId/suggestions/:sId/accept` | `POST`                   | `resume.controller`      | Marks suggestion as ACCEPTED in session state                                       | Click "Accept Diff"                                  | `SUPPORTED`               |
| **Reject Tailoring Suggestion**     | `/resumes/:id/tailor/:jobId`    | `/api/v1/tailoring/:sessionId/suggestions/:sId/reject` | `POST`                   | `resume.controller`      | Marks suggestion as REJECTED in session state                                       | Click "Reject Diff"                                  | `SUPPORTED`               |
| **Complete Tailoring Session**      | `/resumes/:id/tailor/:jobId`    | `/api/v1/tailoring/:sessionId/complete`                | `POST`                   | `resume.controller`      | Creates new immutable `ResumeVersion` applying accepted changes                     | Click "Apply & Save New Version"                     | `SUPPORTED`               |
| **Applications Kanban / List**      | `/applications`                 | `/api/v1/applications`                                 | `GET`, `POST`            | `application.controller` | Lists applications with status filters; creates new application                     | Kanban view, "New Application"                       | `SUPPORTED`               |
| **Applications Funnel Analytics**   | `/applications`                 | `/api/v1/applications/analytics`                       | `GET`                    | `application.controller` | Fetches conversion metrics across all stages                                        | Funnel header summary                                | `SUPPORTED`               |
| **Application Detail**              | `/applications/:id`             | `/api/v1/applications/:id`                             | `GET`, `PUT`, `DELETE`   | `application.controller` | Retrieves application info, recruiter details, notes                                | Page load, "Save", "Archive"                         | `SUPPORTED`               |
| **Application Status Transition**   | `/applications/:id`             | `/api/v1/applications/:id/status`                      | `PATCH`                  | `application.controller` | Updates status (APPLIED, INTERVIEW, OFFER, etc.) + logs event                       | Drag card or status dropdown                         | `SUPPORTED`               |
| **Application Event Timeline**      | `/applications/:id`             | `/api/v1/applications/:id/events`                      | `GET`, `POST`            | `application.controller` | Retrieves timeline history; adds manual interview/note event                        | Timeline panel, "Log Event"                          | `SUPPORTED`               |
| **GitHub Connect**                  | `/integrations/github`          | `/api/v1/github/connect`                               | `GET`                    | `github.controller`      | Returns GitHub OAuth authorization URL                                              | Click "Connect GitHub"                               | `SUPPORTED`               |
| **GitHub Status**                   | `/integrations/github`          | `/api/v1/github/me`                                    | `GET`                    | `github.controller`      | Checks connection status, user profile, rate-limits                                 | Page load                                            | `SUPPORTED`               |
| **GitHub Disconnect**               | `/integrations/github`          | `/api/v1/github/disconnect`                            | `POST`                   | `github.controller`      | Revokes GitHub token and clears linked data                                         | Click "Disconnect Account"                           | `SUPPORTED`               |
| **GitHub Repositories**             | `/github/repositories`          | `/api/v1/github/repositories`                          | `GET`                    | `github.controller`      | Lists authenticated GitHub repositories with stars & primary lang                   | Page load, "Refresh Repos"                           | `SUPPORTED`               |
| **GitHub Repository Detail**        | `/github/repositories/:id`      | `/api/v1/github/repositories/:id`                      | `GET`                    | `github.controller`      | Retrieves repository metadata, stars, topics, fork status                           | Page load                                            | `SUPPORTED`               |
| **GitHub Repo Languages**           | `/github/repositories/:id`      | `/api/v1/github/repositories/:id/languages`            | `GET`                    | `github.controller`      | Returns language breakdown bytes for repository                                     | Page load                                            | `SUPPORTED`               |
| **GitHub Repo Readme**              | `/github/repositories/:id`      | `/api/v1/github/repositories/:id/readme`               | `GET`                    | `github.controller`      | Fetches repository README.md markdown content                                       | "Inspect README" tab                                 | `SUPPORTED`               |
| **GitHub Import to Career Twin**    | `/github/repositories/:id`      | `/api/v1/github/repositories/:id/import`               | `POST`                   | `github.controller`      | Extracts tech stack and creates Project in Career Twin                              | Click "Import to Career Twin"                        | `SUPPORTED`               |
| **GitHub Evidence Summary**         | `/integrations/github`          | `/api/v1/github/evidence`                              | `GET`                    | `github.controller`      | Synthesizes verified codebase evidence for resume claims                            | Page load                                            | `SUPPORTED`               |
| **Google Calendar Connect**         | `/integrations/google-calendar` | `/api/v1/calendar/connect`                             | `GET`                    | `calendar.controller`    | Returns Google OAuth URL with calendar scopes                                       | Click "Connect Google Calendar"                      | `SUPPORTED`               |
| **Google Calendar Status**          | `/integrations/google-calendar` | `/api/v1/calendar/status`                              | `GET`                    | `calendar.controller`    | Returns `{ isConnected, email, expiresAt }`                                         | Page load                                            | `SUPPORTED`               |
| **Google Calendar Disconnect**      | `/integrations/google-calendar` | `/api/v1/calendar/disconnect`                          | `POST`                   | `calendar.controller`    | Revokes Google Calendar OAuth tokens                                                | Click "Disconnect Calendar"                          | `SUPPORTED`               |
| **Interview Sessions List**         | `/interviews`                   | `/api/v1/interviews`                                   | `GET`, `POST`            | `interview.controller`   | Lists past and active interview prep sessions; creates session                      | Page load, "New Prep Session"                        | `SUPPORTED`               |
| **Interview Session Detail**        | `/interviews/:id`               | `/api/v1/interviews/:id`                               | `GET`, `PATCH`, `DELETE` | `interview.controller`   | Retrieves interview session metadata, target role, company                          | Page load                                            | `SUPPORTED`               |
| **Generate Interview Questions**    | `/interviews/:id`               | `/api/v1/interviews/:id/generate-questions`            | `POST`                   | `interview.controller`   | Uses Gemini to generate behavioral & technical questions                            | Click "Generate Questions"                           | `SUPPORTED`               |
| **Interview Questions List**        | `/interviews/:id/questions`     | `/api/v1/interviews/:id/questions`                     | `GET`                    | `interview.controller`   | Lists generated questions for this session                                          | Question list view                                   | `SUPPORTED`               |
| **Submit Question Answer**          | `/interviews/:id/mock`          | `/api/v1/interviews/:id/questions/:qId/answer`         | `POST`                   | `interview.controller`   | Saves candidate answer text (or draft)                                              | "Submit Answer" button                               | `SUPPORTED`               |
| **Evaluate Question Answer**        | `/interviews/:id/mock`          | `/api/v1/interviews/:id/questions/:qId/evaluate`       | `POST`                   | `interview.controller`   | AI evaluation with STAR breakdown, clarity, depth scores                            | Click "Evaluate Answer"                              | `SUPPORTED`               |
| **Interview Prep Plan**             | `/interviews/:id`               | `/api/v1/interviews/:id/prep-plan`                     | `GET`                    | `interview.controller`   | Generates personalized study and talking point guide                                | Click "View Prep Plan"                               | `SUPPORTED`               |
| **Complete Interview Session**      | `/interviews/:id/mock`          | `/api/v1/interviews/:id/complete`                      | `POST`                   | `interview.controller`   | Concludes session, aggregates scores, creates report                                | Click "Finish Interview"                             | `SUPPORTED`               |
| **Interview Final Report**          | `/interviews/:id/report`        | `/api/v1/interviews/:id/report`                        | `GET`                    | `interview.controller`   | Full comprehensive session evaluation & action points                               | Page load                                            | `SUPPORTED`               |
| **Schedule Calendar Event**         | `/interviews/:id`               | `/api/v1/interviews/:id/calendar-event`                | `POST`                   | `interview.controller`   | Schedules mock interview event directly on Google Calendar                          | Click "Add to Google Calendar"                       | `SUPPORTED`               |
| **Analytics Overview**              | `/analytics`                    | `/api/v1/analytics/overview`                           | `GET`                    | `analytics.controller`   | High-level career readiness, skill counts, application stats                        | Page load                                            | `SUPPORTED`               |
| **Analytics - Skill Distribution**  | `/analytics/skills`             | `/api/v1/analytics/skills`                             | `GET`                    | `analytics.controller`   | Categorized skill inventory, proficiency spread                                     | Tab switch / Page load                               | `SUPPORTED`               |
| **Analytics - Skill Gaps**          | `/analytics/skills`             | `/api/v1/analytics/skills/gaps`                        | `GET`                    | `analytics.controller`   | Critical, high, medium skill gaps against target jobs                               | Gaps tab                                             | `SUPPORTED`               |
| **Analytics - Skill Detail**        | `/analytics/skills`             | `/api/v1/analytics/skills/:skill`                      | `GET`                    | `analytics.controller`   | Deep dive into specific skill occurrences & evidence                                | Click specific skill badge                           | `SUPPORTED`               |
| **Analytics - Target Roles**        | `/analytics/roles`              | `/api/v1/analytics/roles`                              | `GET`                    | `analytics.controller`   | Role readiness scores across detected career trajectories                           | Tab switch / Page load                               | `SUPPORTED`               |
| **Analytics - Job Pipeline**        | `/analytics`                    | `/api/v1/analytics/jobs`                               | `GET`                    | `analytics.controller`   | Saved jobs volume, average match scores                                             | Tab switch                                           | `SUPPORTED`               |
| **Analytics - Application Funnel**  | `/analytics/applications`       | `/api/v1/analytics/applications`                       | `GET`                    | `analytics.controller`   | Funnel conversion metrics, stage duration, response rate                            | Page load                                            | `SUPPORTED`               |
| **Analytics - Interview Trends**    | `/analytics/interviews`         | `/api/v1/analytics/interviews`                         | `GET`                    | `analytics.controller`   | Historical interview scores, STAR dimension performance                             | Page load                                            | `SUPPORTED`               |
| **Analytics - Resume Health**       | `/analytics`                    | `/api/v1/analytics/resumes`                            | `GET`                    | `analytics.controller`   | ATS scores across versions, keyword coverage trends                                 | Tab switch                                           | `SUPPORTED`               |
| **Analytics - Evidence Graph**      | `/analytics/evidence`           | `/api/v1/analytics/evidence`                           | `GET`                    | `analytics.controller`   | Ratio of Verified vs Needs Review vs Unsupported career claims                      | Page load                                            | `SUPPORTED`               |
| **Analytics - Progress Trajectory** | `/analytics`                    | `/api/v1/analytics/progress`                           | `GET`                    | `analytics.controller`   | Longitudinal career velocity and readiness progression                              | Chart rendering                                      | `SUPPORTED`               |
| **Create Analytics Snapshot**       | `/analytics`                    | `/api/v1/analytics/snapshots`                          | `POST`                   | `analytics.controller`   | Freezes current readiness & gap metrics for historical tracking                     | Click "Capture Snapshot"                             | `SUPPORTED`               |
| **Learning Plans List**             | `/learning`                     | `/api/v1/learning-plans`                               | `GET`, `POST`            | `learning.controller`    | Lists all personal upskilling plans; creates a blank plan                           | Page load, "New Learning Plan"                       | `SUPPORTED`               |
| **Learning Plan Detail**            | `/learning/:id`                 | `/api/v1/learning-plans/:id`                           | `GET`, `PATCH`, `DELETE` | `learning.controller`    | Retrieves learning plan, description, target date, progress %                       | Page load, "Edit", "Delete"                          | `SUPPORTED`               |
| **AI Curriculum Generation**        | `/learning/:id`                 | `/api/v1/learning-plans/:id/generate`                  | `POST`                   | `learning.controller`    | Generates AI curriculum with milestones and tasks via Gemini                        | Click "Auto-Generate Curriculum"                     | `SUPPORTED`               |
| **Learning Plan Goals**             | `/learning/:id`                 | `/api/v1/learning-plans/:id/goals`                     | `GET`, `POST`            | `learning.controller`    | Lists goals; creates a new structured goal                                          | Goal breakdown view, "Add Goal"                      | `SUPPORTED`               |
| **Update Learning Goal**            | `/learning/:id`                 | `/api/v1/learning-goals/:goalId`                       | `PATCH`                  | `learning.controller`    | Modifies goal title, order, or completion state                                     | Goal checkbox / edit inline                          | `SUPPORTED`               |
| **Create Learning Task**            | `/learning/:id`                 | `/api/v1/learning-tasks`                               | `POST`                   | `learning.controller`    | Adds action item (e.g., project, reading, practice)                                 | "Add Task" button under goal                         | `SUPPORTED`               |
| **Update / Complete Task**          | `/learning/:id`                 | `/api/v1/learning-tasks/:taskId`                       | `PATCH`, `DELETE`        | `learning.controller`    | Toggles task status (`TODO`, `IN_PROGRESS`, `DONE`)                                 | Task checkbox click, delete                          | `SUPPORTED`               |
| **Complete Learning Plan**          | `/learning/:id`                 | `/api/v1/learning-plans/:id/complete`                  | `POST`                   | `learning.controller`    | Marks plan completed, feeds verified proof into Career Twin                         | Click "Complete Plan & Verify"                       | `SUPPORTED`               |
| **User Settings / Preferences**     | `/settings`                     | _Partially supported via `/profile`_                   | N/A                      | _User / Settings_        | Theme, notifications, account management                                            | Save preferences                                     | `PARTIALLY SUPPORTED`     |
| **User Profile Summary**            | `/profile`                      | `/api/v1/profile` & `/auth/me`                         | `GET`, `PUT`             | `career` & `auth`        | Basic account info, avatar, email, password update                                  | Profile edit form                                    | `PARTIALLY SUPPORTED`     |

---

## 3. Deep-Dive Domain Mapping Specifications

### 3.1 Authentication & User Session

- **Primary Hook / Context:** `useAuth()` or `localStorage` tokens.
- **Interceptors:** Automatic retry queue on HTTP `401 Unauthorized` hitting `/api/v1/auth/refresh`. If refresh fails, tokens are evicted and window redirects to `/login`.
- **Token Security:** Tokens are stored in browser memory/localStorage for API access; no tokens are displayed in UI text or logs.

### 3.2 Career Twin (Profile, Experience, Education, Projects, Skills)

- **Primary Route:** `/career`
- **Data Hydration:** Parallel fetching via `Promise.all([careerApi.getProfile(), careerApi.getExperiences(), careerApi.getEducation(), careerApi.getProjects(), careerApi.getSkills(), careerApi.getCertifications(), careerApi.getAchievements()])`.
- **Evidence Binding:** Every Project record has an `evidenceUrl` (e.g. GitHub link) and `technologies: string[]`. Skills are tagged with `category` and `proficiency` (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`).

### 3.3 Resume Intelligence & ATS Scoring

- **Primary Routes:** `/resumes`, `/resumes/:id`, `/resumes/:id/analysis`
- **Upload Flow:** Multipart form data post to `/api/v1/resumes`. Returns parsed text, word count, candidate info.
- **Analysis Execution:** Post to `/api/v1/resumes/:id/analyze`. Returns:
  ```json
  {
    "score": 85,
    "atsScore": 88,
    "breakdown": {
      "impact": 82,
      "skills": 90,
      "clarity": 85,
      "format": 89
    },
    "strengths": ["Strong quantitative metrics in experience bullets", ...],
    "weaknesses": ["Missing cloud deployment technologies", ...],
    "recommendations": ["Incorporate Docker and Kubernetes evidence into Career Twin", ...]
  }
  ```
- **Evidence Comparison:** Client compares `resume.skills` vs `careerTwin.skills`. Highlight items present in resume but missing evidence in Career Twin as `NEEDS_REVIEW`.

### 3.4 Job Intelligence & DNA Analysis

- **Primary Routes:** `/jobs`, `/jobs/:id`, `/jobs/:id/analysis`, `/jobs/search`
- **External Discovery:** `/api/v1/job-search` pulls live jobs from Adzuna API with salary data.
- **Job DNA Structure:** Analysis extracts:
  - `roleSummary`: High-level role thesis.
  - `requiredSkills`: Hard requirements (must-haves).
  - `preferredSkills`: Bonus competencies.
  - `experienceYears`: Minimum years required.
  - `responsibilities`: Primary execution tasks.
  - `keywords`: High-frequency keywords for ATS screening.

### 3.5 AI Resume Tailoring & Evidence Guard

- **Primary Route:** `/resumes/:id/tailor/:jobId`
- **Session Lifecycle:**
  1. `tailoringApi.generateTailoring(resumeId, jobId)` creates a `TailoringSession`.
  2. Gemini analyzes Job DNA against Resume + Career Twin.
  3. Returns array of `suggestions`:
     - `id`: UUID.
     - `section`: Header/Experience/Skills/Summary.
     - `originalText`: Source text in current resume.
     - `suggestedText`: AI-tailored high-impact replacement.
     - `reason`: Rationale tied to target job requirements.
     - `status`: `PENDING` | `ACCEPTED` | `REJECTED`.
     - `evidenceStatus`: `VERIFIED` | `NEEDS_REVIEW` | `UNSUPPORTED`.
     - `evidenceDetails`: Backing project or experience reference in Career Twin.
  4. User reviews each suggestion diff:
     - `tailoringApi.acceptSuggestion(sessionId, suggestionId)`
     - `tailoringApi.rejectSuggestion(sessionId, suggestionId)`
  5. `tailoringApi.completeSession(sessionId)` generates a new immutable `ResumeVersion`.

### 3.6 Application CRM & Pipeline Funnel

- **Primary Route:** `/applications`, `/applications/:id`
- **Stages:** `SAVED` -> `APPLIED` -> `ASSESSMENT` -> `INTERVIEW` -> `OFFER` -> `REJECTED` / `WITHDRAWN`.
- **Provenance Tracking:** Applications link to `jobId`, `resumeVersionId`, and `tailoringSessionId` to record exactly which tailored resume was used.
- **Event Audit Log:** Every status transition automatically creates an `ApplicationEvent` with timestamps, notes, and metadata.

### 3.7 Interview Intelligence & Simulation

- **Primary Routes:** `/interviews`, `/interviews/:id`, `/interviews/:id/mock`, `/interviews/:id/report`
- **Generation:** AI creates questions parameterized by `difficulty` (`EASY`, `MEDIUM`, `HARD`), `mode` (`PREPARATION`, `MOCK_INTERVIEW`), `targetRole`, and `targetCompany`.
- **STAR Evaluation Matrix:** Candidate submits answer text; Gemini grades:
  - `overallScore`: (0 - 100)
  - `relevanceScore`: (0 - 100)
  - `clarityScore`: (0 - 100)
  - `technicalDepthScore`: (0 - 100)
  - `starEvaluation`: Situation, Task, Action, Result structured feedback.
  - `suggestedImprovements`: Specific constructive tips.

### 3.8 Career Analytics & Skill Gaps

- **Primary Routes:** `/analytics`, `/analytics/skills`, `/analytics/roles`, `/analytics/applications`, `/analytics/interviews`, `/analytics/evidence`
- **Readiness Formula:** Aggregate calculated score derived from:
  - Resume ATS Scores (weight: 25%)
  - Target Job Match Averages (weight: 25%)
  - Evidence Graph Ratio (weight: 20%)
  - Interview Mock Performance (weight: 15%)
  - Learning Plan Task Velocity (weight: 15%)

---

## 4. Unsupported or Out-of-Scope Capabilities

The following features were identified during the audit as lacking backend routes, controllers, or database models. Frontend designs must **NOT** invent fake UI actions for them:

1. **Self-Service Password Reset via Email:** Backend has no forgot-password or password-reset-token router.
2. **Social Login (Google / GitHub OAuth for Main Auth):** Main auth uses bcrypt passwords. GitHub and Google OAuth are strictly used as downstream data integration pipelines (`/api/v1/github/*` and `/api/v1/calendar/*`), not primary authentication providers.
3. **Live WebRTC Audio/Video Mock Interview Recording:** The backend evaluates text transcripts via REST. Audio/video streams are not supported in the existing modular monolith.
4. **Direct Job Application Submission:** Resumind is a Career Operating System, not a job board aggregator that submits applications directly to employers; external applications are tracked via manual or Adzuna URL links.
5. **Multi-Tenant Team / Recruiter Collaboration:** Schema and JWT auth are single-user candidate scoped (`userId`). No multi-tenant team workspaces exist.

---

_Verified & Synchronized against codebase: `MSIVAPAPARAO13/ai-resume-analyzer`_
