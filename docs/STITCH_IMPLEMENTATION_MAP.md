# Resumind — Google Stitch UI to Production API Implementation Map

This document defines the contractual mapping between each Google Stitch screen design and the Resumind backend API, Prisma schema models, and frontend UI states.

---

## 1. Global Architectural Mapping Principles

- **Visual Source of Truth**: Google Stitch Project `13898246341962442915` (Linear/Vercel-inspired deep canvas, high contrast cards, status pills, evidence provenance badges, responsive composition).
- **Functional Source of Truth**: Resumind Express REST API (`/api/v1/*`), Prisma Schema, PostgreSQL database, and Redis cache.
- **Styling Architecture**: Bootstrap 5 + CSS Design Tokens (`--rm-*`). No Tailwind CSS dependencies.
- **Evidence Guard Contract**: All AI tailoring suggestions and match evidence must render strictly with backend `guardStatus` (`VERIFIED`, `NEEDS_REVIEW`, `UNSUPPORTED`).
- **Authentication**: JWT Bearer token via `Authorization: Bearer <accessToken>` header on all protected routes. Automatic refresh on HTTP 401.

---

## 2. Screen-by-Screen Implementation Map

### 01. Landing Page

- **Stitch Screen**: Marketing & Value Proposition
- **Existing Route**: `/`
- **API Endpoint**: Public static marketing / health: `GET /api/v1/health`
- **Method**: `GET`
- **Prisma Data**: None (Public static content with feature tours)
- **UI Actions**: Click "Get Started" → `/register`, "Sign In" → `/login`, "Explore Features"
- **States**:
  - _Loading_: Seamless static hydration
  - _Empty_: N/A
  - _Error_: Offline network banner if API health is unreachable
  - _Success_: Render Hero, Evidence Guard value prop, Career Twin interactive demo teaser

---

### 02. Authentication — Login & Register

- **Stitch Screen**: Auth Workspace (Login & Register modals/pages)
- **Existing Routes**: `/login`, `/register`
- **API Endpoints**:
  - `POST /api/v1/auth/login` (Body: `{ email, password }`)
  - `POST /api/v1/auth/register` (Body: `{ email, password, name? }`)
  - `POST /api/v1/auth/refresh` (Body: `{ refreshToken }`)
  - `POST /api/v1/auth/logout` (Headers: Bearer token)
  - `GET /api/v1/auth/me` (Headers: Bearer token)
- **Prisma Data**: `User`, `RefreshToken`
- **UI Actions**: Enter credentials, toggle remember me, submit form, error dismissal
- **States**:
  - _Loading_: Button spinner, disabled inputs
  - _Empty_: Clean input fields with validation placeholders
  - _Error_: Validation toast or alert banner (`INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`)
  - _Success_: Token storage in localStorage/cookies, redirect to `/dashboard` or `/career`

---

### 03. Dashboard — Command Center

- **Stitch Screen**: `Resumind — Dashboard Command Center` (`4d9a6420d52c49faa00ff3be67798a78`, `3e566915eb15426c91515e358ea15f44`)
- **Existing Route**: `/dashboard`
- **API Endpoints**:
  - `GET /api/v1/analytics/overview` (Overview readiness score, metrics, snapshots)
  - `GET /api/v1/resumes` (Active resume score, ATS health)
  - `GET /api/v1/jobs` (Saved jobs, match targets)
  - `GET /api/v1/applications/analytics` (Application funnel counts)
  - `GET /api/v1/interviews` (Recent interview scores)
  - `GET /api/v1/analytics/skills/gaps` (Top prioritized skill gaps)
  - `GET /api/v1/learning-plans` (Active learning plan & progress)
- **Prisma Data**: `CareerSnapshot`, `Resume`, `Job`, `Application`, `InterviewSession`, `LearningPlan`
- **UI Actions**:
  - Click "Improve My Resume" → `/resumes`
  - Click "Analyze Job Match" → `/jobs`
  - Click "Practice Interview" → `/interviews`
  - Click "View Learning Plan" → `/learning`
- **States**:
  - _Loading_: Skeletons for StatCards, ScoreRing, and recent activity
  - _Empty_: Guided onboarding checklist with "Upload Your First Resume"
  - _Error_: Alert with "Failed to load dashboard metrics" + retry button
  - _Success_: Live readiness gauge (0-100), 4 metric summary cards, skill gaps preview, active learning plan progress bar, and recent application activity feed

---

### 04. Career Twin — Ground Truth Architecture

- **Stitch Screen**: `Resumind — Career Twin Workspace` (`0cef12bbbe6147a3b03244b655028ae7`, `c905607b79f64ec3a87b989fe02cdd35`)
- **Existing Route**: `/career`
- **API Endpoints**:
  - `GET /api/v1/profile`
  - `PUT /api/v1/profile` (Body: `{ headline, summary, targetRole, targetLevel }`)
  - `GET /api/v1/experiences`, `POST /api/v1/experiences`, `PUT /api/v1/experiences/:id`, `DELETE /api/v1/experiences/:id`
  - `GET /api/v1/education`, `POST /api/v1/education`, `PUT /api/v1/education/:id`, `DELETE /api/v1/education/:id`
  - `GET /api/v1/projects`, `POST /api/v1/projects`, `PUT /api/v1/projects/:id`, `DELETE /api/v1/projects/:id`
  - `GET /api/v1/skills`, `POST /api/v1/skills`, `PUT /api/v1/skills/:id`, `DELETE /api/v1/skills/:id`
  - `GET /api/v1/certifications`, `POST /api/v1/certifications`, `PUT /api/v1/certifications/:id`, `DELETE /api/v1/certifications/:id`
  - `GET /api/v1/achievements`, `POST /api/v1/achievements`, `PUT /api/v1/achievements/:id`, `DELETE /api/v1/achievements/:id`
- **Prisma Data**: `CareerProfile`, `Experience`, `Education`, `Project`, `Skill`, `Certification`, `Achievement`
- **UI Actions**: Add/Edit/Delete modals for every entity, inline tag additions, external link validation
- **States**:
  - _Loading_: Card skeleton loaders for each category tab
  - _Empty_: "No experience recorded yet. Add your work history to power ATS tailoring."
  - _Error_: Field validation errors and inline banner
  - _Success_: Tabbed cards showing verified career record, skill proficiency pills, and evidence URLs

---

### 05. Resume Intelligence & ATS Diagnostics

- **Stitch Screen**: `Resumind — Resume Intelligence & ATS Diagnostics` (`15ec1857e1cf4f12a69e6b14a8537a5d`)
- **Existing Routes**: `/resumes`, `/resumes/:id`, `/resumes/:id/analysis`
- **API Endpoints**:
  - `GET /api/v1/resumes`
  - `POST /api/v1/resumes` (Multipart upload: PDF/DOCX/TXT file)
  - `GET /api/v1/resumes/:id`
  - `DELETE /api/v1/resumes/:id`
  - `POST /api/v1/resumes/:id/analyze`
  - `GET /api/v1/resumes/:id/analysis`
  - `GET /api/v1/resumes/:id/versions`
  - `GET /api/v1/resumes/:id/versions/:vId`
- **Prisma Data**: `Resume`, `ResumeVersion`, `ResumeAnalysis`
- **UI Actions**: Drag-and-drop resume upload, trigger ATS re-analysis, compare against Career Twin, view version history
- **States**:
  - _Loading_: File upload progress bar, "Analyzing resume with Gemini AI..." pulse skeleton
  - _Empty_: "No resumes uploaded yet. Upload a PDF or DOCX to run ATS diagnostics."
  - _Error_: File type rejection (`Only PDF, DOCX, TXT allowed`) or analysis failure banner
  - _Success_: ATS Readiness Gauge (e.g. 88%), section breakdown bars (Impact, Skills, Clarity, Format), strengths & weaknesses lists, and version comparison

---

### 06. Job DNA & Match Matrix

- **Stitch Screen**: `Resumind — Job DNA & Match Matrix` (`98268ee6a86a4d28843da2e142b73963`, `c9d69eb99b0a4fc9bed0a71b7780a5e7`)
- **Existing Routes**: `/jobs`, `/jobs/new`, `/jobs/:id`, `/jobs/:id/analysis`, `/jobs/:id/match/:matchId`, `/jobs/search`
- **API Endpoints**:
  - `GET /api/v1/jobs`
  - `POST /api/v1/jobs` (Body: `{ title, company, description, location?, employmentType? }`)
  - `GET /api/v1/jobs/:id`
  - `PUT /api/v1/jobs/:id`
  - `DELETE /api/v1/jobs/:id`
  - `POST /api/v1/jobs/:id/analyze` (Extracts Job DNA)
  - `GET /api/v1/jobs/:id/analysis`
  - `GET /api/v1/jobs/:id/matches`
  - `POST /api/v1/jobs/:id/match/:resumeId`
  - `GET /api/v1/jobs/:id/matches/:matchId`
  - `GET /api/v1/job-search` (Adzuna search)
  - `POST /api/v1/job-search/import` (Adzuna import)
- **Prisma Data**: `Job`, `JobRequirement`, `JobAnalysis`, `JobMatch`
- **UI Actions**: Create target job, extract Job DNA, calculate match against resume, import from Adzuna
- **States**:
  - _Loading_: Semantic parsing spinner
  - _Empty_: "No saved target jobs. Paste a job description or search live opportunities."
  - _Error_: Invalid job URL / API timeout message
  - _Success_: Separate **Required Skills** vs **Preferred Skills** badges, Overall Match Score Ring, Strong / Partial / Missing breakdown, and "Tailor Resume for this Job" CTA

---

### 07. AI Resume Tailoring & Evidence Guard Review

- **Stitch Screen**: `Resumind — AI Resume Tailoring Workspace` (`06eb92605b004f6fbf27ed8dfc1260f4`, `8785fb74d33148738630c157182cde15`)
- **Existing Route**: `/resumes/:id/tailor/:jobId`
- **API Endpoints**:
  - `POST /api/v1/resumes/:id/tailor/:jobId` (Initiates session)
  - `GET /api/v1/tailoring/:sessionId` (Fetches session & suggestions)
  - `POST /api/v1/tailoring/:sessionId/suggestions/:sId/accept`
  - `POST /api/v1/tailoring/:sessionId/suggestions/:sId/reject`
  - `POST /api/v1/tailoring/:sessionId/complete` (Creates new `ResumeVersion`)
- **Prisma Data**: `ResumeTailoringSession`, `ResumeTailoringSuggestion`, `ResumeVersion`
- **UI Actions**: Accept / Reject each suggestion, review Evidence Guard badge, click "Apply & Create New Version"
- **States**:
  - _Loading_: "Synthesizing evidence-backed recommendations..." skeleton
  - _Empty_: "All suggestions reviewed. Ready to generate tailored resume version."
  - _Error_: Error banner if AI quota or network fails with graceful fallback
  - _Success_: Side-by-side diff cards with Original vs Proposed text, reason, Evidence Guard badge (`VERIFIED`, `NEEDS_REVIEW`, `UNSUPPORTED`), and immutable new version confirmation modal

---

### 08. Application Pipeline & CRM

- **Stitch Screen**: `Resumind — Applications Pipeline CRM` (`f9d1f34aa0534d1da71fefe615c02300`)
- **Existing Routes**: `/applications`, `/applications/new`, `/applications/:id`
- **API Endpoints**:
  - `GET /api/v1/applications`
  - `POST /api/v1/applications` (Body: `{ company, role, status?, appliedAt?, notes?, recruiterName? }`)
  - `GET /api/v1/applications/:id`
  - `PUT /api/v1/applications/:id`
  - `DELETE /api/v1/applications/:id`
  - `PATCH /api/v1/applications/:id/status` (Body: `{ status }`)
  - `GET /api/v1/applications/:id/events`
  - `POST /api/v1/applications/:id/events` (Body: `{ type, description }`)
  - `GET /api/v1/applications/analytics`
- **Prisma Data**: `Application`, `ApplicationEvent`
- **UI Actions**: Switch between Kanban & List view, drag/drop or change stage dropdown (`SAVED`, `APPLIED`, `ASSESSMENT`, `INTERVIEW`, `OFFER`, `REJECTED`), add timeline note, record recruiter contact
- **States**:
  - _Loading_: Column skeleton loaders
  - _Empty_: "No applications in this stage. Add an application to track your pipeline."
  - _Error_: Transition validation error alert
  - _Success_: Interactive 6-stage Kanban board, conversion funnel statistics, and event timeline drawer

---

### 09. GitHub Career Evidence Integration

- **Stitch Screen**: External Evidence & GitHub Import
- **Existing Routes**: `/integrations`, `/integrations/github`, `/github/repositories`, `/github/repositories/:id`
- **API Endpoints**:
  - `GET /api/v1/github/connect` (OAuth redirect)
  - `GET /api/v1/github/me` (Connection status)
  - `POST /api/v1/github/disconnect`
  - `GET /api/v1/github/repositories`
  - `GET /api/v1/github/repositories/:id`
  - `GET /api/v1/github/repositories/:id/languages`
  - `GET /api/v1/github/repositories/:id/readme`
  - `POST /api/v1/github/repositories/:id/import` (Imports into Career Twin Projects)
  - `GET /api/v1/github/evidence`
- **Prisma Data**: `GitHubConnection`, `GitHubRepository`, `Project`
- **UI Actions**: Connect GitHub account, inspect repository languages & README, select repo to "Import to Career Twin"
- **States**:
  - _Loading_: Repo sync spinner
  - _Empty_: "Connect GitHub to verify coding evidence, repositories, and technical skills."
  - _Error_: OAuth callback or rate-limit alert
  - _Success_: Verified repository cards, language byte breakdown, and imported project badge

---

### 10. Interview Intelligence & Mock Simulation

- **Stitch Screen**: `Resumind — Interview Intelligence & Mock Simulation` (`8a8c8379fb5a4828863366eeeb956c48`)
- **Existing Routes**: `/interviews`, `/interviews/new`, `/interviews/:id`, `/interviews/:id/questions`, `/interviews/:id/mock`, `/interviews/:id/report`
- **API Endpoints**:
  - `GET /api/v1/interviews`
  - `POST /api/v1/interviews` (Body: `{ title, targetRole?, difficulty?, mode? }`)
  - `GET /api/v1/interviews/:id`
  - `POST /api/v1/interviews/:id/generate-questions`
  - `GET /api/v1/interviews/:id/questions`
  - `POST /api/v1/interviews/:id/questions/:qId/answer` (Body: `{ answerText }`)
  - `POST /api/v1/interviews/:id/questions/:qId/evaluate`
  - `POST /api/v1/interviews/:id/complete`
  - `GET /api/v1/interviews/:id/report`
  - `POST /api/v1/interviews/:id/calendar-event`
- **Prisma Data**: `InterviewSession`, `InterviewQuestion`, `InterviewAnswer`, `InterviewReminder`
- **UI Actions**: Configure interview session, answer questions with STAR framework guidance, trigger AI evaluation, view comprehensive session report
- **States**:
  - _Loading_: Question generation pulse animation
  - _Empty_: "No interview sessions recorded. Start a mock interview tailored to your target role."
  - _Error_: Evaluation error with retry trigger
  - _Success_: STAR framework scoring cards (Situation, Task, Action, Result), strengths & weaknesses, model answer tips, and session summary report

---

### 11. Career Velocity, Analytics & Skill Gaps

- **Stitch Screen**: `Resumind — Career Velocity & Analytics` (`7618ef35b6c74a94b9a7708ecad803e3`)
- **Existing Routes**: `/analytics`, `/analytics/skills`, `/analytics/roles`, `/analytics/applications`, `/analytics/interviews`, `/analytics/evidence`
- **API Endpoints**:
  - `GET /api/v1/analytics/overview`
  - `GET /api/v1/analytics/skills`
  - `GET /api/v1/analytics/skills/gaps`
  - `GET /api/v1/analytics/roles`
  - `GET /api/v1/analytics/applications`
  - `GET /api/v1/analytics/interviews`
  - `GET /api/v1/analytics/resumes`
  - `GET /api/v1/analytics/evidence`
  - `GET /api/v1/analytics/progress`
  - `POST /api/v1/analytics/snapshots`
- **Prisma Data**: `CareerSnapshot`, `Skill`, `JobRequirement`, `Application`, `InterviewSession`
- **UI Actions**: Switch metric tabs, filter by time window, capture analytics snapshot
- **States**:
  - _Loading_: Chart and table skeleton pulses
  - _Empty_: Informational placeholders when single data point exists
  - _Error_: Chart render fallback with retry
  - _Success_: Career Readiness trend chart, Skill Gap Matrix (Critical, High, Medium), Role Readiness comparison, and Application conversion funnel

---

### 12. Learning Plans & Growth

- **Stitch Screen**: Upskilling Workspace & Proof of Work
- **Existing Routes**: `/learning`, `/learning/new`, `/learning/:id`
- **API Endpoints**:
  - `GET /api/v1/learning-plans`
  - `POST /api/v1/learning-plans` (Body: `{ title, targetRole?, targetDate? }`)
  - `GET /api/v1/learning-plans/:id`
  - `PUT /api/v1/learning-plans/:id`
  - `DELETE /api/v1/learning-plans/:id`
  - `POST /api/v1/learning-plans/:id/generate` (AI curriculum generation)
  - `GET /api/v1/learning-plans/:id/goals`, `POST /api/v1/learning-plans/:id/goals`
  - `PATCH /api/v1/learning-goals/:goalId`
  - `POST /api/v1/learning-tasks`
  - `PATCH /api/v1/learning-tasks/:taskId` (Toggle TODO / IN_PROGRESS / DONE)
  - `POST /api/v1/learning-plans/:id/complete`
- **Prisma Data**: `LearningPlan`, `LearningGoal`, `LearningTask`
- **UI Actions**: Create plan, toggle task completion status, auto-generate AI curriculum, verify proof of work
- **States**:
  - _Loading_: Curriculum generation skeleton
  - _Empty_: "No active learning plans. Create a plan or generate one from your skill gaps."
  - _Error_: Task update error banner
  - _Success_: Milestone progress bar, task status checkboxes (`TODO`, `IN_PROGRESS`, `DONE`), and proof-of-work link verification
