# RESUMIND — FRONTEND UI/UX DESIGN SPECIFICATION & GOOGLE STITCH BLUEPRINT

**Platform:** Resumind — AI Career Intelligence & Resume Optimization SaaS  
**Repository:** `MSIVAPAPARAO13/ai-resume-analyzer`  
**Author:** Senior Product Designer & Frontend Architect  
**Specification Version:** 1.0.0 (Production Master)  
**Target Frontend Stack:** React 19 + TypeScript + React Router v7 + Bootstrap 5 + Vanilla CSS Design Tokens  
**Backend Foundation:** Express + TypeScript + Prisma ORM + PostgreSQL + Redis (Verified Source of Truth)

---

## 1. Product Design Direction & Visual Identity

### 1.1 Product Philosophy

Resumind is an **Enterprise-Grade AI Career Operating System**, not a simplistic resume builder. It transforms an individual's fragmented career history into an active, verifiable **Career Twin** and provides algorithmic precision across resume intelligence, ATS readiness, job match DNA, application tracking, interview simulation, and skill progression.

### 1.2 Aesthetic Pillars

1. **Intelligence & Clarity (Linear / Vercel Aesthetic):**
   - Deep, calibrated dark theme (`#090D16` canvas, `#0F172A` cards, `#1E293B` borders) paired with ultra-crisp typography and micro-contrasts.
   - Clean structural grid layouts with zero clutter, avoiding excessive gradients, rounded bubbles, or decorative charts with no meaning.
2. **Evidence-First Integrity (Stripe-Grade Trust):**
   - Every AI assertion, match percentage, and suggested resume modification must immediately display its provenance and verification badge.
   - AI recommendations visually state whether they are backed by verified user experience or require user review.
3. **Progressive Disclosure:**
   - **Level 1 (Executive Summary):** Primary scores, high-level readiness, actionable cards.
   - **Level 2 (Diagnostic Insights):** Breakdown metrics, gap categorization, skill distribution.
   - **Level 3 (Verifiable Evidence):** Code commit provenance, STAR evaluation breakdowns, raw ATS keyword density.
4. **Purpose-Driven Primary Actions:**
   - Every view has exactly one high-contrast primary CTA (e.g., Dashboard: _"Improve My Resume"_; Job Detail: _"Analyze Match"_; Tailoring: _"Accept & Create Version"_).

---

## 2. Information Architecture

```
Resumind Career Operating System
│
├── [Public / Guest]
│   ├── /                 (Landing Page — Value Proposition & Feature Tour)
│   ├── /login            (Authentication — Login)
│   └── /register         (Authentication — Registration)
│
├── [Authenticated App Shell] (Persistent Sidebar + Header + Context Panel)
│   │
│   ├── 01. Overview
│   │   └── /dashboard    (Command Center — Readiness Score, Action Center, Summary Cards)
│   │
│   ├── 02. Career Architecture
│   │   ├── /career       (Career Twin — Profile, Experience, Education, Projects, Skills)
│   │   ├── /resumes      (Resume Workspace — List, Upload, ATS Health)
│   │   ├── /resumes/:id  (Resume Intelligence — Deep Scoring & Twin Comparison)
│   │   └── /resumes/:id/analysis (Detailed ATS Diagnostic & Gemini Feedback)
│   │
│   ├── 03. Job Intelligence & Matching
│   │   ├── /jobs         (Target Job Explorer & Saved Opportunities)
│   │   ├── /jobs/search  (Adzuna Live Discovery & Salary Benchmarking)
│   │   ├── /jobs/:id     (Job DNA — Role Thesis, Required vs Preferred Skills)
│   │   └── /jobs/:id/match/:matchId (Match Matrix — Resume vs Job DNA vs Career Twin)
│   │
│   ├── 04. AI Resume Tailoring
│   │   └── /resumes/:id/tailor/:jobId (Tailoring Workspace — Evidence Guard Review)
│   │
│   ├── 05. Pipeline & CRM
│   │   ├── /applications     (Application Pipeline — Kanban & Funnel Analytics)
│   │   └── /applications/:id (Application Timeline, Provenance & Notes)
│   │
│   ├── 06. Interview Simulation
│   │   ├── /interviews       (Interview Intelligence Dashboard & Session Setup)
│   │   ├── /interviews/:id/mock (Interactive Mock Session & STAR Feedback)
│   │   └── /interviews/:id/report (Comprehensive Session Report & Action Points)
│   │
│   ├── 07. Growth & Upskilling
│   │   ├── /analytics        (Career Velocity & Comprehensive Health Overview)
│   │   ├── /analytics/skills (Skill Inventory & Gap Prioritization)
│   │   ├── /analytics/roles  (Role Trajectory Readiness)
│   │   ├── /learning         (Upskilling Workspace & Active Learning Plans)
│   │   └── /learning/:id     (Curriculum Detail, Milestone Goals & Proof of Work)
│   │
│   └── 08. Integrations & Account
│       ├── /integrations     (Connected Services Hub)
│       ├── /integrations/github (GitHub OAuth & Repositories Evidence Browser)
│       ├── /integrations/google-calendar (Google Calendar Sync & Interview Scheduling)
│       ├── /profile          (Candidate Profile & Credentials)
│       └── /settings         (System Preferences & Notifications)
```

---

## 3. Global Navigation Structure

### 3.1 Desktop Layout (>= 1024px)

- **Left Sidebar (260px fixed width):**
  - Brand header with Resumind logo & live environment indicator.
  - Grouped navigation links with active state pill markers, count badges, and semantic icons.
  - User footer with mini avatar, candidate name, online status, and quick sign-out CTA.
- **Top Header Bar (64px fixed height):**
  - Dynamic breadcrumbs indicating current hierarchy.
  - Global Search / Quick Switcher trigger (`Cmd+K`).
  - Readiness quick badge indicator (`84% Ready`).
  - Notification icon and connected integration status pills (GitHub, Google Calendar).
- **Main Content Area:**
  - Max container width: `1400px` centered with fluid gutters (`px-4 py-4`).
- **Optional Contextual Drawer (360px right slide-out):**
  - Used for deep diffs, quick AI explanations, and interview note-taking.

### 3.2 Mobile Layout (< 1024px)

- Offcanvas slide-out drawer triggered via header hamburger.
- Floating bottom quick-action bar for P0 tasks (`Upload Resume`, `Log Application`, `Prep Interview`).
- Zero horizontal overflow: responsive tables transform into stacked data cards.

---

## 4. Design System Tokens (CSS / Bootstrap 5 Variables)

```css
:root {
  /* ── Canvas & Surface Colors ── */
  --rm-canvas-bg: #090d16;
  --rm-surface-base: #0f172a;
  --rm-surface-raised: #141e33;
  --rm-surface-overlay: #1e293b;
  --rm-surface-subtle: #0b1120;

  /* ── Border & Dividers ── */
  --rm-border-subtle: #1e293b;
  --rm-border-default: #2a374d;
  --rm-border-emphasis: #3b4d6b;

  /* ── Typography & Text ── */
  --rm-text-primary: #f8fafc;
  --rm-text-secondary: #94a3b8;
  --rm-text-muted: #64748b;
  --rm-text-inverse: #090d16;

  /* ── Brand Primary (Intelligence Blue) ── */
  --rm-primary-500: #3b82f6;
  --rm-primary-600: #2563eb;
  --rm-primary-700: #1d4ed8;
  --rm-primary-glow: rgba(59, 130, 246, 0.25);

  /* ── Evidence Guard Status Colors ── */
  --rm-evidence-verified-bg: rgba(16, 185, 129, 0.12);
  --rm-evidence-verified-border: #10b981;
  --rm-evidence-verified-text: #34d399;

  --rm-evidence-review-bg: rgba(245, 158, 11, 0.12);
  --rm-evidence-review-border: #f59e0b;
  --rm-evidence-review-text: #fbbf24;

  --rm-evidence-unsupported-bg: rgba(239, 68, 68, 0.12);
  --rm-evidence-unsupported-border: #ef4444;
  --rm-evidence-unsupported-text: #f87171;

  /* ── Semantic Feedback ── */
  --rm-success: #10b981;
  --rm-warning: #f59e0b;
  --rm-danger: #ef4444;
  --rm-info: #06b6d4;

  /* ── Typography Scale ── */
  --rm-font-sans:
    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --rm-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --rm-fs-display: 2.25rem; /* 36px */
  --rm-fs-h1: 1.75rem; /* 28px */
  --rm-fs-h2: 1.375rem; /* 22px */
  --rm-fs-h3: 1.125rem; /* 18px */
  --rm-fs-body: 0.9375rem; /* 15px */
  --rm-fs-sm: 0.8125rem; /* 13px */
  --rm-fs-xs: 0.6875rem; /* 11px */

  /* ── Spacing Scale ── */
  --rm-space-1: 0.25rem; /* 4px */
  --rm-space-2: 0.5rem; /* 8px */
  --rm-space-3: 0.75rem; /* 12px */
  --rm-space-4: 1rem; /* 16px */
  --rm-space-6: 1.5rem; /* 24px */
  --rm-space-8: 2rem; /* 32px */
  --rm-space-12: 3rem; /* 48px */

  /* ── Radii & Elevation ── */
  --rm-radius-sm: 6px;
  --rm-radius-md: 10px;
  --rm-radius-lg: 14px;
  --rm-radius-full: 9999px;

  --rm-shadow-card: 0 4px 20px -2px rgba(0, 0, 0, 0.45);
  --rm-shadow-glow: 0 0 25px -5px var(--rm-primary-glow);
}
```

---

## 5. Reusable Component System

| Component Name       | Description                                                                                     | Key Props & Slots                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `AppShell`           | Persistent wrapper containing Desktop Sidebar, Top Header, and Mobile Drawer.                   | `children`, `activeRoute`, `breadcrumbs`                                  |
| `SidebarNav`         | Collapsible vertical navigation with section dividers and count badges.                         | `items`, `collapsed`, `onToggle`                                          |
| `HeaderBar`          | Top app header with search trigger, candidate avatar, and notification badges.                  | `user`, `readinessScore`, `onOpenSearch`                                  |
| `PageHeader`         | Standardized title banner with eyebrow tag, title, description, and primary CTA.                | `title`, `description`, `badge`, `primaryAction`                          |
| `StatCard`           | Metric summary card showing raw value, delta indicator, and sparkline or subtext.               | `label`, `value`, `delta`, `icon`, `trend`                                |
| `ScoreRing`          | Circular SVG progress meter for ATS and Career Readiness scores.                                | `score` (0-100), `size` (sm/md/lg), `colorScheme`                         |
| `EvidenceBadge`      | Accessible badge enforcing Evidence Guard taxonomy (`VERIFIED`, `NEEDS_REVIEW`, `UNSUPPORTED`). | `status`, `showIcon`, `tooltip`                                           |
| `SkillBadge`         | Pill badge displaying skill name, category icon, and proficiency or match status.               | `skill`, `category`, `matchState`, `onRemove`                             |
| `StatusBadge`        | Application CRM stage badge with semantic color coding.                                         | `status` (`SAVED` to `OFFER`), `size`                                     |
| `EmptyState`         | Actionable fallback container explaining what is missing, why it matters, and primary CTA.      | `icon`, `title`, `description`, `actionLabel`, `onAction`                 |
| `ErrorState`         | Human-readable error banner with retry trigger and technical error mask.                        | `title`, `message`, `retryFn`, `errorCode`                                |
| `LoadingSkeleton`    | Animated pulse placeholder mimicking exact card, table, or profile layout.                      | `variant` (`card`, `table`, `form`, `ring`), `count`                      |
| `ConfirmDialog`      | Accessible modal dialog for non-destructive or destructive confirmations.                       | `isOpen`, `title`, `message`, `confirmVariant`, `onConfirm`, `onClose`    |
| `JobCard`            | Compact card displaying company, title, match score, required skills, and CTAs.                 | `job`, `matchScore`, `onMatch`, `onTailor`                                |
| `ResumeCard`         | Resume version card showing filename, ATS score, target role, and last updated time.            | `resume`, `onAnalyze`, `onTailor`, `onDelete`                             |
| `KanbanBoard`        | Multi-column drag-and-drop board for job applications.                                          | `columns`, `applications`, `onStatusChange`                               |
| `ApplicationCard`    | Kanban item card with company, role, match score, follow-up date, and notes preview.            | `application`, `onClick`                                                  |
| `DiffReviewCard`     | AI Tailoring diff comparison showing original vs proposed text, reason, and accept/reject.      | `suggestion`, `onAccept`, `onReject`                                      |
| `InterviewQuestion`  | Question prompt container with STAR framework guidance and candidate response box.              | `question`, `index`, `total`, `onSubmitAnswer`                            |
| `STARScoreBreakdown` | Visual card displaying Situation, Task, Action, Result evaluation metrics and tips.             | `evaluation`, `overallScore`                                              |
| `TimelineEvent`      | Vertical chronological event for application history or career progression.                     | `type`, `date`, `description`, `author`                                   |
| `IntegrationCard`    | Status card for GitHub or Google Calendar connection with OAuth toggle.                         | `integration`, `isConnected`, `accountEmail`, `onConnect`, `onDisconnect` |

---

## 6. Complete Screen Inventory & Support Status

| ID     | Screen Name                   | Route                           | Module       | Backend API Backing                           | Support Status            |
| ------ | ----------------------------- | ------------------------------- | ------------ | --------------------------------------------- | ------------------------- |
| **01** | Landing Page                  | `/`                             | Marketing    | Static content + Public endpoints             | `SUPPORTED`               |
| **02** | Login                         | `/login`                        | Auth         | `POST /api/v1/auth/login`                     | `SUPPORTED`               |
| **03** | Register                      | `/register`                     | Auth         | `POST /api/v1/auth/register`                  | `SUPPORTED`               |
| **04** | Forgot Password               | `/forgot-password`              | Auth         | None (API lacks reset router)                 | `NOT CURRENTLY SUPPORTED` |
| **05** | Dashboard (Command Center)    | `/dashboard`                    | Dashboard    | `GET /api/v1/analytics/overview` + multi      | `SUPPORTED`               |
| **06** | Career Twin Overview          | `/career`                       | Career       | `GET /api/v1/profile` + lists                 | `SUPPORTED`               |
| **07** | Career Twin — Experience      | `/career` (tab)                 | Career       | `GET/POST/PUT/DELETE /api/v1/experiences`     | `SUPPORTED`               |
| **08** | Career Twin — Education       | `/career` (tab)                 | Career       | `GET/POST/PUT/DELETE /api/v1/education`       | `SUPPORTED`               |
| **09** | Career Twin — Projects        | `/career` (tab)                 | Career       | `GET/POST/PUT/DELETE /api/v1/projects`        | `SUPPORTED`               |
| **10** | Career Twin — Skills          | `/career` (tab)                 | Career       | `GET/POST/PUT/DELETE /api/v1/skills`          | `SUPPORTED`               |
| **11** | Career Twin — Certifications  | `/career` (tab)                 | Career       | `GET/POST/PUT/DELETE /api/v1/certifications`  | `SUPPORTED`               |
| **12** | Career Twin — Achievements    | `/career` (tab)                 | Career       | `GET/POST/PUT/DELETE /api/v1/achievements`    | `SUPPORTED`               |
| **13** | Resume Workspace              | `/resumes`                      | Resume       | `GET /api/v1/resumes`                         | `SUPPORTED`               |
| **14** | Resume Upload Modal           | `/resumes`                      | Resume       | `POST /api/v1/resumes` (multipart)            | `SUPPORTED`               |
| **15** | Resume Detail                 | `/resumes/:id`                  | Resume       | `GET /api/v1/resumes/:id`                     | `SUPPORTED`               |
| **16** | Resume ATS Analysis View      | `/resumes/:id/analysis`         | Resume       | `GET /api/v1/resumes/:id/analysis`            | `SUPPORTED`               |
| **17** | Resume Version History        | `/resumes/:id` (drawer)         | Resume       | `GET /api/v1/resumes/:id/versions`            | `SUPPORTED`               |
| **18** | Job List & Saved              | `/jobs`                         | Jobs         | `GET /api/v1/jobs`                            | `SUPPORTED`               |
| **19** | Job Create (Manual)           | `/jobs/new`                     | Jobs         | `POST /api/v1/jobs`                           | `SUPPORTED`               |
| **20** | Adzuna Live Job Search        | `/jobs/search`                  | Jobs         | `GET /api/v1/job-search`                      | `SUPPORTED`               |
| **21** | Job Detail & Overview         | `/jobs/:id`                     | Jobs         | `GET /api/v1/jobs/:id`                        | `SUPPORTED`               |
| **22** | Job DNA Extraction            | `/jobs/:id/analysis`            | Jobs         | `GET /api/v1/jobs/:id/analysis`               | `SUPPORTED`               |
| **23** | Job Match Comparison          | `/jobs/:id/match/:matchId`      | Jobs         | `GET /api/v1/jobs/:id/matches/:matchId`       | `SUPPORTED`               |
| **24** | AI Resume Tailoring Review    | `/resumes/:id/tailor/:jobId`    | Tailoring    | `GET /api/v1/tailoring/:sessionId`            | `SUPPORTED`               |
| **25** | Tailoring Completion Modal    | `/resumes/:id/tailor/:jobId`    | Tailoring    | `POST /api/v1/tailoring/:sessionId/complete`  | `SUPPORTED`               |
| **26** | Applications Kanban Board     | `/applications`                 | Applications | `GET /api/v1/applications`                    | `SUPPORTED`               |
| **27** | Application Create Modal      | `/applications/new`             | Applications | `POST /api/v1/applications`                   | `SUPPORTED`               |
| **28** | Application Detail & Timeline | `/applications/:id`             | Applications | `GET /api/v1/applications/:id` + events       | `SUPPORTED`               |
| **29** | Integrations Hub              | `/integrations`                 | Integrations | Composite status                              | `SUPPORTED`               |
| **30** | GitHub Connection View        | `/integrations/github`          | GitHub       | `GET /api/v1/github/me` & connect             | `SUPPORTED`               |
| **31** | GitHub Repositories Browser   | `/github/repositories`          | GitHub       | `GET /api/v1/github/repositories`             | `SUPPORTED`               |
| **32** | GitHub Repo Detail & Evidence | `/github/repositories/:id`      | GitHub       | `GET /api/v1/github/repositories/:id`         | `SUPPORTED`               |
| **33** | GitHub Import to Career Twin  | `/github/repositories/:id`      | GitHub       | `POST /api/v1/github/repositories/:id/import` | `SUPPORTED`               |
| **34** | Interview Dashboard           | `/interviews`                   | Interviews   | `GET /api/v1/interviews`                      | `SUPPORTED`               |
| **35** | Interview Session Setup       | `/interviews/new`               | Interviews   | `POST /api/v1/interviews`                     | `SUPPORTED`               |
| **36** | Mock Interview Simulation     | `/interviews/:id/mock`          | Interviews   | `POST /api/v1/interviews/:id/questions/...`   | `SUPPORTED`               |
| **37** | Answer Evaluation Modal       | `/interviews/:id/mock`          | Interviews   | `POST /api/v1/interviews/:id/.../evaluate`    | `SUPPORTED`               |
| **38** | Interview Final Report        | `/interviews/:id/report`        | Interviews   | `GET /api/v1/interviews/:id/report`           | `SUPPORTED`               |
| **39** | Google Calendar Connection    | `/integrations/google-calendar` | Calendar     | `GET /api/v1/calendar/status`                 | `SUPPORTED`               |
| **40** | Schedule Calendar Event       | `/interviews/:id`               | Calendar     | `POST /api/v1/interviews/:id/calendar-event`  | `SUPPORTED`               |
| **41** | Career Analytics Overview     | `/analytics`                    | Analytics    | `GET /api/v1/analytics/overview`              | `SUPPORTED`               |
| **42** | Skill Inventory & Gaps        | `/analytics/skills`             | Analytics    | `GET /api/v1/analytics/skills/gaps`           | `SUPPORTED`               |
| **43** | Target Roles Trajectory       | `/analytics/roles`              | Analytics    | `GET /api/v1/analytics/roles`                 | `SUPPORTED`               |
| **44** | Application Funnel Analytics  | `/analytics/applications`       | Analytics    | `GET /api/v1/analytics/applications`          | `SUPPORTED`               |
| **45** | Interview Score Analytics     | `/analytics/interviews`         | Analytics    | `GET /api/v1/analytics/interviews`            | `SUPPORTED`               |
| **46** | Career Evidence Graph         | `/analytics/evidence`           | Analytics    | `GET /api/v1/analytics/evidence`              | `SUPPORTED`               |
| **47** | Learning Plans Workspace      | `/learning`                     | Learning     | `GET /api/v1/learning-plans`                  | `SUPPORTED`               |
| **48** | Learning Plan Detail & Tasks  | `/learning/:id`                 | Learning     | `GET /api/v1/learning-plans/:id` + goals      | `SUPPORTED`               |

---

## 7. Screen-by-Screen Specifications (Priority Screens)

### 7.1 Screen 05: Dashboard (Command Center)

- **Route:** `/dashboard`
- **Primary Persona:** Job-seeking candidate monitoring career momentum.
- **Primary CTA:** `Improve My Resume` (links to `/resumes`) or `Review Top Match` (links to highest match job).
- **Layout:**
  - **Hero Bar:** Greeting with candidate's actual name (`"Good morning, Alex"`), date, and high-impact **Career Readiness Score ring (e.g. 84%)** with delta badge (`+6% this week`).
  - **Quick Metric Strip (4 Cards):**
    1. _Latest Resume:_ Title, ATS Score (e.g. 88%), Last Analyzed timestamp.
    2. _Top Job Match:_ Company, Role, Match score (e.g. 91%), Missing critical skill pill.
    3. _Application Funnel:_ Active count, Interviews scheduled, Offers received.
    4. _Interview Readiness:_ Average mock score, last practice difficulty.
  - **Two-Column Work Center:**
    - _Left (8 cols):_ Actionable Priority Queue (e.g., _"3 unreviewed tailoring suggestions"_, _"Docker skill gap detected"_, _"Upcoming mock interview tomorrow"_).
    - _Right (4 cols):_ Career Twin Completeness Meter & Quick-Add shortcuts (Experience, Project, Certification).
- **States:**
  - _Loading:_ 4 animated skeleton cards + hero ring pulse.
  - _Empty:_ Onboarding checklist for new users (Step 1: Set Profile, Step 2: Upload Resume, Step 3: Pick Target Role).
  - _Error:_ Dismissible alert with retry button for analytics service.

### 7.2 Screen 06-12: Career Twin Workspace

- **Route:** `/career`
- **Primary Persona:** Professional curating comprehensive career evidence.
- **Primary CTA:** `Add Experience` (or active section CTA).
- **Layout:**
  - **Profile Summary Header:** Avatar, Name, Headline, Target Role, Location, Bio with inline edit mode.
  - **Sub-Navigation Tabs:** `Experiences`, `Projects & Evidence`, `Skills Matrix`, `Education`, `Certifications`, `Achievements`.
  - **Section Panels:**
    - _Experiences:_ Chronological timeline cards with company logo placeholder, title, date range, bullet points, and tagged technologies.
    - _Projects:_ Cards with GitHub repo link, live demo URL, tech tags, and green `VERIFIED EVIDENCE` indicator if imported from GitHub.
    - _Skills:_ Grouped chip lists (Languages, Frontend, Backend, Databases, Cloud/DevOps, AI/ML) with proficiency dots.
- **User Actions:** Add, Edit inline, Delete with modal confirmation, Reorder.

### 7.3 Screen 15-16: Resume Intelligence & ATS Diagnostics

- **Route:** `/resumes/:id` & `/resumes/:id/analysis`
- **Primary CTA:** `Analyze with Gemini` or `Tailor to Job`.
- **Layout:**
  - **Score Banner:** Large 120px SVG Score Ring with ATS Readiness score (0-100), Content Score, Keyword Coverage, and Structure Rating.
  - **Diagnostic Grid (2 Columns):**
    - _Left (6 cols):_ Section-by-section breakdown (Summary, Work History, Education, Skills) with green checkmarks or red flags.
    - _Right (6 cols):_ Evidence Guard Alignment Matrix comparing Resume statements against Career Twin ground truth. Highlight unverified claims in amber `NEEDS_REVIEW`.
  - **AI Recommendations Drawer:** Specific, high-impact suggestions with copy-to-clipboard actions.

### 7.4 Screen 21-22: Job Intelligence & Job DNA

- **Route:** `/jobs/:id` & `/jobs/:id/analysis`
- **Primary CTA:** `Match My Resume` (triggers semantic comparison).
- **Layout:**
  - **Header:** Role Title, Company, Location, Employment Type, Adzuna source link, Salary estimate badge.
  - **Job DNA Badge Clusters:**
    - _Required Skills (Must-Have):_ High-contrast purple pill badges.
    - _Preferred Skills (Nice-to-Have):_ Muted secondary badges.
    - _Role Responsibilities:_ Bulleted card with AI-extracted core duties.
    - _ATS Keywords:_ Frequency-weighted tag cloud.
  - **Matches Tab:** Displays history of candidate resumes matched against this specific position.

### 7.5 Screen 23: Job Match Matrix

- **Route:** `/jobs/:id/match/:matchId`
- **Primary CTA:** `Tailor Resume for this Job` (navigates to `/resumes/:id/tailor/:jobId`).
- **Layout:**
  - **Match Summary Header:** Composite Match Score (e.g. `82% Match`), Seniority alignment pill (`Matches Mid-Senior`), and Missing Years gap alert.
  - **Comparison Matrix Table:**
    | Requirement / Skill | Found in Resume? | Found in Career Twin? | Evidence Status | Recommendation |
    |---|---|---|---|---|
    | TypeScript | Yes (4 yrs) | Yes (Project Evidence) | `VERIFIED` | Keep prominent |
    | Kubernetes | Inferred | No | `NEEDS_REVIEW` | Add real deployment proof |
    | GraphQL | Missing | No | `UNSUPPORTED` | Add to Learning Plan |
  - **Action Plan Strip:** One-click shortcuts to add missing skills to a new Learning Plan or initiate tailored resume generation.

### 7.6 Screen 24-25: AI Resume Tailoring Workspace

- **Route:** `/resumes/:id/tailor/:jobId`
- **Primary CTA:** `Complete Tailoring & Save Version`.
- **Layout:**
  - **Progress Header:** Session progress bar (`4 of 9 suggestions reviewed`), Target Job badge, and Evidence Guard summary (e.g. `5 Verified, 3 Review, 1 Unsupported`).
  - **Split-Screen Diff Canvas (50/50):**
    - _Left Pane (Original Resume):_ Highlighted active paragraph in subtle red strikethrough.
    - _Right Pane (Proposed Revision):_
      - Suggested text with green insertion highlight.
      - Strategic reason box (_"Optimizes for job keyword 'Distributed Systems' using verified Experience at Acme Corp"_).
      - Prominent Evidence Guard Badge (`VERIFIED` vs `NEEDS_REVIEW` vs `UNSUPPORTED`).
      - Two distinct action buttons: `Accept Diff` (Checkmark) and `Reject Diff` (Cross).
  - **Completion State:** Creates a new, distinct `ResumeVersion` (e.g. `v2 — Tailored for Stripe Software Engineer`). The original master resume is strictly preserved and never modified.

### 7.7 Screen 26-28: Applications CRM & Kanban

- **Route:** `/applications` & `/applications/:id`
- **Primary CTA:** `New Application`.
- **Layout:**
  - **Kanban Board (7 Columns):**
    `Saved` | `Applied` | `Assessment` | `Interview` | `Offer` | `Rejected` | `Withdrawn`
  - **Application Cards:**
    - Company, Role, Target Salary.
    - Match score pill (e.g. `89%`).
    - Provenance badge: linked tailored resume version (`Resume v2 (Stripe)`).
    - Next follow-up badge (colored red if overdue).
  - **Application Detail View (`/applications/:id`):**
    - Recruiter name, email, direct job posting URL.
    - Interactive chronological audit timeline with manual event logging (_"Passed technical screen"_, _"Sent thank you email"_).

### 7.8 Screen 34-38: Interview Intelligence & Simulation

- **Route:** `/interviews`, `/interviews/:id/mock`, `/interviews/:id/report`
- **Primary CTA:** `Start Mock Session` (in dashboard) / `Submit Answer` (in mock).
- **Layout:**
  - **Mock Session Canvas:**
    - Progress indicator (`Question 3 of 7`).
    - Target company & difficulty tag (`HARD — Senior Distributed Systems`).
    - Prominent Question Card with clear typography.
    - Candidate Response Textarea with word count meter.
    - Action Bar: `Skip Question`, `Submit Answer`, `End Interview Early`.
  - **AI Evaluation Card (Post-Answer):**
    - Overall score dial (0-100).
    - 4 STAR metric progress bars: Situation, Task, Action, Result.
    - Specific constructive coaching (_"Strong action verbs, but missing quantifiable metrics in the Result phase"_).
  - **Report Page:** Session composite score, strengths list, growth opportunities, and direct button to schedule Google Calendar practice.

### 7.9 Screen 41-46: Career Analytics & Skill Gaps

- **Route:** `/analytics`, `/analytics/skills`
- **Layout:**
  - **Career Velocity Line Chart:** Readiness score progression across monthly snapshots.
  - **Application Conversion Funnel:** Visual drop-off bar chart (Saved -> Applied -> Interview -> Offer).
  - **Skill Gap Matrix (Prioritized):**
    - `CRITICAL` (Required by 80%+ of saved jobs, missing evidence).
    - `HIGH` (Required by 50%+ of saved jobs).
    - `MEDIUM` / `LOW`.
    - Every gap card includes a direct CTA: `Create Learning Plan`.

### 7.10 Screen 47-48: Learning Plans & Proof-of-Work

- **Route:** `/learning`, `/learning/:id`
- **Primary CTA:** `Auto-Generate Curriculum` (AI) or `Add Learning Plan`.
- **Layout:**
  - Plan title, target role, target completion date, overall completion meter.
  - Milestone Goals accordion with task checkboxes (`TODO`, `IN_PROGRESS`, `DONE`).
  - Upon 100% completion, user submits a Proof-of-Work URL (GitHub repo or project), which triggers verified ingestion into the Career Twin.

---

## 8. Complete User Journeys

### Journey 1: New User Onboarding to First Resume Analysis

1. User arrives on `/` and clicks `Get Started`.
2. Registers at `/register` with email, password, and name.
3. System redirects to `/career`. User completes basic Career Twin profile (Headline: _"Senior Full-Stack Engineer"_).
4. Navigates to `/resumes` and uploads `resume.pdf` via drag-and-drop.
5. System parses resume text and redirects to `/resumes/:id`.
6. User clicks `Analyze Resume`. Gemini evaluates ATS readiness and section scores.
7. User navigates to `/dashboard` to view updated 78% Career Readiness Command Center.

### Journey 2: Job Matching to Evidence-Backed AI Tailoring

1. From `/dashboard`, candidate clicks `Explore Jobs` -> `/jobs/search`.
2. Searches Adzuna for _"Staff Backend Engineer, Remote"_. Finds matching listing.
3. Clicks `Import to Resumind`. System saves to `/jobs/:id`.
4. User clicks `Analyze Job DNA`. Gemini extracts required skills and keywords.
5. User clicks `Match My Resume`. System renders Match Matrix (`74% Match`).
6. User clicks `Tailor Resume`. System initiates `POST /api/v1/resumes/:id/tailor/:jobId`.
7. Split-screen tailoring workspace displays 6 suggestions:
   - 4 suggestions marked `VERIFIED` (accepted).
   - 1 suggestion marked `NEEDS_REVIEW` (modified).
   - 1 suggestion marked `UNSUPPORTED` (rejected to prevent hallucination).
8. Candidate clicks `Apply & Save New Version`. System creates `ResumeVersion v2`.

### Journey 3: Application Pipeline Management

1. From Job Detail, candidate clicks `Add to Applications`.
2. System opens `/applications/new` pre-filled with company, role, and `ResumeVersion v2`.
3. Application card appears in `Applied` column on `/applications` Kanban.
4. Candidate receives recruiter interview email, drags card to `Interview` column.
5. Opens `/applications/:id` and logs event _"Technical Phone Screen with VP of Eng"_.

### Journey 4: Interview Simulation & AI Coaching

1. From `/applications/:id`, candidate clicks `Prep for Interview` -> `/interviews/new`.
2. System links target job and tailored resume, generating 5 behavioral and technical questions.
3. Candidate enters Mock Simulation (`/interviews/:id/mock`).
4. Answers Question 1 using STAR format. Clicks `Submit Answer`.
5. Gemini generates instant score (88/100) with detailed STAR breakdown.
6. Candidate completes all 5 questions.
7. System generates `/interviews/:id/report` and offers `Schedule Calendar Event` button.

### Journey 5: GitHub Code Evidence Verification

1. Candidate navigates to `/integrations/github`.
2. Clicks `Connect GitHub`. Completes OAuth authorization.
3. Navigates to `/github/repositories`. System lists authenticated public/private repositories.
4. Selects repository `microservices-order-engine`.
5. Clicks `Import to Career Twin`. Backend extracts languages (Go, Docker, PostgreSQL) and README summary.
6. Record appears under `/career` Projects tab with permanent green `VERIFIED EVIDENCE` badge.

---

## 9. Evidence Guard UI Rules & Governance

Resumind enforces strict ethical AI guardrails:

1. **Visual Triad Hierarchy:**
   - `VERIFIED` (Green): Backed by verified experience or project evidence in the Career Twin.
   - `NEEDS_REVIEW` (Amber): Inferred from resume context, but lacking verified grounding.
   - `UNSUPPORTED` (Rose/Red): No factual basis found in the user's career graph.
2. **Anti-Hallucination Guard:**
   - In the Tailoring Workspace, any suggestion flagged as `UNSUPPORTED` must display an alert banner:
     _"Warning: Resumind detected no backing evidence for this claim in your Career Twin. Claiming unverified skills may compromise interview credibility."_
3. **No Blind Auto-Approval:**
   - Tailoring sessions require manual user review. Users must review all suggestions before the `Save Version` action activates.
4. **Non-Destructive Storage:**
   - Tailored resumes create distinct `ResumeVersion` rows. Source resumes are immutable.

---

## 10. Responsive Design & Accessibility (WCAG 2.2 AA)

- **Breakpoints:**
  - Desktop: `>= 1200px` (Full Sidebar + Multi-column workspaces).
  - Tablet: `768px - 1199px` (Collapsed icon sidebar, stacked 2-column grids).
  - Mobile: `< 768px` (Offcanvas navigation, single-column stack, card tables).
- **Accessibility Mandates:**
  - Contrast ratio >= 4.5:1 for normal text; >= 3:1 for large display text and interactive controls.
  - No information conveyed by color alone: all status badges pair semantic colors with distinct SVG icons and text labels.
  - Full keyboard navigability (`Tab`, `Shift+Tab`, `Enter`, `Escape` for modals, arrow keys for Kanban cards).
  - Explicit `aria-label`, `aria-expanded`, and `role` attributes on all dynamic panels.

---

## 11. Google Stitch Prompts for Priority Screens

The following standalone, production-grade prompts are engineered for direct execution in **Google Stitch**.

```markdown
<!-- ========================================================================= -->
<!-- STITCH PROMPT 01: DASHBOARD COMMAND CENTER (P0)                           -->
<!-- ========================================================================= -->

Generate a high-fidelity desktop UI for "Resumind — Dashboard", an AI Career Operating System command center.
Theme: Deep dark modern SaaS (#090D16 background, #0F172A card surfaces, #1E293B subtle borders, #3B82F6 primary blue).
Layout:

- Left navigation sidebar (260px): Resumind logo, links for Overview (Dashboard), Career Twin, Resumes, Jobs, Applications, Interviews, Analytics, Learning Plans, Integrations, and user profile footer.
- Top Header (64px): "Career Overview" breadcrumb, quick search trigger (Cmd+K), and "84% Career Readiness" pill badge.
- Main Canvas:
  - Top Hero Banner: "Good morning, Alex. Your career momentum is in the top 15% this month." Large, glowing SVG ring gauge displaying "84% Career Readiness" with "+6% vs last week" subtext and primary CTA "Improve My Resume".
  - Metric Strip (4 Columns):
    1. Latest Resume: "Senior_FullStack_2026.pdf", ATS Score 88%, analyzed 2 days ago.
    2. Top Job Match: "Stripe — Staff Software Engineer", 91% Match, Missing: Kafka.
    3. Applications: 12 Total, 4 In Review, 2 Interviews Scheduled.
    4. Interview Prep: 82% Avg Score, Hard difficulty.
  - Content Grid: - Left Column (8 cols): "Priority Action Items" card containing 3 action rows with status badges:
    Row 1: [Amber Badge: NEEDS REVIEW] "3 AI Tailoring suggestions pending review for Stripe application." [Button: Review Diffs]
    Row 2: [Red Badge: CRITICAL GAP] "Target roles demand Kubernetes proof. Create a learning plan." [Button: Create Plan]
    Row 3: [Green Badge: VERIFIED] "GitHub repo 'payment-engine' successfully verified as career evidence." - Right Column (4 cols): "Career Twin Health" card with a breakdown meter of verified experiences (4), projects (6), and skills (28), plus quick-action buttons to add work history or upload resumes.
    Style: Crisp Inter typography, subtle card elevations, zero gradients, ultra-clean professional aesthetic.
```

```markdown
<!-- ========================================================================= -->
<!-- STITCH PROMPT 02: CAREER TWIN WORKSPACE (P0)                              -->
<!-- ========================================================================= -->

Generate a comprehensive desktop UI for "Resumind — Career Twin", the candidate's canonical verified career profile.
Theme: Deep dark modern SaaS (#090D16 background, #0F172A card surfaces, #1E293B borders).
Layout:

- Standard left navigation sidebar and top header.
- Main Canvas:
  - Profile Banner: Candidate avatar, "Alex Mercer", Headline: "Senior Distributed Systems & Full-Stack Engineer", Location: "San Francisco, CA / Remote", Target Role: "Staff Software Engineer". Edit Profile button.
  - Pill Navigation Tabs: [Experiences (Active)], [Projects & Evidence], [Skills Matrix], [Education], [Certifications], [Achievements].
  - Tab Content — Experiences: - Top bar with "+ Add Experience" primary button and filter search. - Timeline List of 3 experience cards:
    Card 1: "Lead Platform Engineer @ CloudScale Technologies" (2022 — Present, 3 yrs). - Bullet points with bold metric highlights ("Scaled Kafka throughput by 42% across 12 node clusters"). - Tech tags: Go, Kubernetes, Kafka, PostgreSQL, Terraform. - Verification Badge: Green "VERIFIED GROUND TRUTH" with edit/delete icons.
    Card 2: "Senior Software Engineer @ FinTech Core" (2019 — 2022, 3 yrs). - Bullet points describing architecture re-platforming. - Tech tags: Node.js, TypeScript, Redis, AWS. - Actions: Edit, Delete.
    Style: Professional enterprise resume management UI, high-contrast badges, clean timeline connectors.
```

```markdown
<!-- ========================================================================= -->
<!-- STITCH PROMPT 03: RESUME INTELLIGENCE & ATS DIAGNOSTICS (P0)              -->
<!-- ========================================================================= -->

Generate a desktop UI for "Resumind — Resume Intelligence & ATS Diagnostic", analyzing a parsed resume against algorithmic hiring standards.
Theme: Deep dark modern SaaS (#090D16 background, #0F172A card surfaces, #1E293B borders, #10B981 emerald accents).
Layout:

- Header: Resume title "Alex_Mercer_Staff_Resume_v1", parsed file size, target role "Staff Engineer", and primary CTA button "Tailor to Target Job".
- Top Diagnostic Summary:
  - Large circular ATS Score gauge showing "86 / 100 — Excellent ATS Health".
  - 4 Sub-score progress bars: Content Impact (90%), Skill Coverage (82%), Format Readability (95%), Quantifiable Evidence (78%).
- Two-Column Analysis:
  - Left Column (6 cols): "Section-by-Section Diagnostics"
    - Experience Section: [Green Check] "Strong action verbs and quantifiable metrics present in 85% of bullets."
    - Skills Section: [Amber Warning] "Cloud platforms mentioned in text but missing specific containerization keywords."
    - Education Section: [Green Check] "Accredited BS in Computer Science correctly formatted."
  - Right Column (6 cols): "Career Twin Ground Truth Verification"
    - Matrix comparing resume bullet claims to verified Career Twin records.
    - Row 1: "Led high-scale payment processing" -> [Green Badge: VERIFIED via GitHub project 'pay-core'].
    - Row 2: "Architected real-time streaming pipeline" -> [Amber Badge: NEEDS REVIEW — Missing company reference].
- Bottom Drawer: "Recommended Improvements" with one-click copyable rewrite suggestions.
```

```markdown
<!-- ========================================================================= -->
<!-- STITCH PROMPT 04: JOB DNA & MATCH MATRIX (P0)                             -->
<!-- ========================================================================= -->

Generate a desktop UI for "Resumind — Job DNA & Candidate Match Matrix", comparing a candidate's resume and Career Twin against a job description.
Theme: Deep dark modern SaaS (#090D16 background, #0F172A card surfaces, #1E293B borders, #8B5CF6 purple accents).
Layout:

- Top Header: Role Title: "Principal Distributed Systems Engineer", Company: "Datadog", Location: "New York, NY (Hybrid)", Match Score Badge: "78% Match". Primary CTA: "Generate Tailored Resume".
- Job DNA Overview (Left 5 cols):
  - "Required Skills (Hard Criteria)": High-contrast purple pill badges (Distributed Consensus, Raft/Paxos, Go, C++, Linux Internals, Low Latency).
  - "Preferred Skills": Secondary muted badges (Kubernetes, eBPF, OpenTelemetry).
  - "Key Responsibilities": Bulleted summary extracted by AI.
- Match Matrix Table (Right 7 cols):
  - Title: "Candidate Alignment vs Job DNA"
  - Interactive table with columns: [Requirement], [Found in Resume], [Career Twin Evidence], [Status Badge], [Action]
  - Row 1: "Go / Golang" | "Yes (4 yrs)" | "Verified in 2 Projects" | [Green: VERIFIED] | "Highlight"
  - Row 2: "Distributed Consensus" | "Partial" | "Under Review" | [Amber: NEEDS REVIEW] | "Enhance Bullet"
  - Row 3: "eBPF Profiling" | "No" | "None Found" | [Red: UNSUPPORTED] | "Add to Learning Plan"
    Style: High-density diagnostic comparison, legible monospace skill tags, clear visual status distinction.
```

```markdown
<!-- ========================================================================= -->
<!-- STITCH PROMPT 05: AI RESUME TAILORING WORKSPACE (P0)                      -->
<!-- ========================================================================= -->

Generate a desktop UI for "Resumind — AI Resume Tailoring Workspace with Evidence Guard".
Theme: Deep dark modern SaaS (#090D16 background, #0F172A surfaces, #1E293B borders).
Layout:

- Top Progress Bar: "Reviewing Suggestions for Datadog — Principal Engineer" (Progress: 3 of 6 reviewed).
  - Evidence Guard Status Summary: 4 Verified, 1 Needs Review, 1 Unsupported.
  - Primary Button: "Save Tailored Version v2" (disabled until all suggestions are decided).
- Split-Screen Diff Canvas (50% / 50%):
  - Left Pane (Original Resume Excerpt):
    Card with original work experience bullet:
    "Engineered internal data synchronization service to transfer user events between databases."
  - Right Pane (AI Proposed Revision):
    Card with proposed replacement text:
    "Architected distributed event synchronization pipeline utilizing Go and Raft consensus, achieving sub-10ms replication across multi-region PostgreSQL clusters."
    - Reason callout: "Directly addresses Datadog requirement for 'Distributed Consensus' and 'Go'."
    - Evidence Guard Badge: Prominent Green Badge [VERIFIED: Grounded in Career Twin Experience at FinTech Core].
    - Action Controls: Two large buttons: [Green Button: Accept Revision] and [Red Button: Reject Revision].
- Bottom Alert Banner:
  - If a suggestion is unsupported, shows: "Warning: No evidence found for this claim. Reject or add verified proof to Career Twin."
    Style: Visual diff interface similar to GitHub code review, clean typography, unambiguous status signaling.
```

```markdown
<!-- ========================================================================= -->
<!-- STITCH PROMPT 06: APPLICATIONS CRM KANBAN (P1)                            -->
<!-- ========================================================================= -->

Generate a desktop UI for "Resumind — Applications CRM", a job search pipeline tracker.
Theme: Deep dark modern SaaS (#090D16 background, #0F172A surfaces, #1E293B borders).
Layout:

- Header: "Application Pipeline" with search bar, filter by role/company, and "+ New Application" primary button.
- Funnel Summary Strip: 14 Saved -> 8 Applied -> 3 Assessment -> 2 Interview -> 1 Offer.
- 5-Column Horizontal Kanban Board:
  - Column 1: Saved (3)
  - Column 2: Applied (4)
  - Column 3: Assessment (1)
  - Column 4: Interview (2)
  - Column 5: Offer (1)
- Kanban Cards within columns:
  - Card format: - Top row: Company name ("Stripe"), Role ("Staff Engineer"), and Match Badge ("92%"). - Middle row: Linked tailored resume version pill ("Tailored v2"). - Bottom row: Recruiter name, Follow-up date badge ("Follow up: Tomorrow" in yellow), and menu dots.
    Style: Linear-inspired task board, smooth borders, compact information hierarchy, no clutter.
```

```markdown
<!-- ========================================================================= -->
<!-- STITCH PROMPT 07: INTERVIEW INTELLIGENCE & MOCK SIMULATION (P1)           -->
<!-- ========================================================================= -->

Generate a desktop UI for "Resumind — Mock Interview Simulation", an AI-powered technical and behavioral interview preparation tool.
Theme: Deep dark modern SaaS (#090D16 background, #0F172A surfaces, #1E293B borders, #3B82F6 accents).
Layout:

- Header: Session: "Staff Engineer Technical Interview @ Stripe" | Mode: Mock Simulation | Difficulty: Hard | Question 2 of 5.
- Main Canvas:
  - Question Card:
    "Describe a situation where a distributed service you owned experienced cascading latency failure. How did you diagnose the root cause, and what architectural safeguards did you implement?"
  - STAR Framework Guidance Pills: [Situation] [Task] [Action] [Result].
  - Response Input Area: Large monospace text area with word counter (Currently 142 words).
  - Audio/Voice placeholder toggle: "Speech-to-Text Enabled".
  - Action Controls: "Skip Question", "Save Draft", and Primary Button "Submit Answer for Evaluation".
- Lower Drawer (revealed after submission):
  - Overall Answer Score: "88 / 100".
  - STAR Evaluation Breakdown: - Situation: Clear context provided (9/10). - Task: Explicit ownership articulated (8/10). - Action: Detailed technical root cause and circuit breaker implementation (9/10). - Result: [Amber Warning] Lacking quantifiable recovery metrics (6/10). "Tip: Include MTTR reduction percentage."
    Style: Distraction-free interview environment, professional coaching aesthetics.
```

---

## 12. Implementation Priorities & Roadmap

### Phase A: Core Foundation & Visual Unification (Days 1–3)

1. **Design Tokens & Global Styles:** Implement CSS variables (`--rm-*`) in `apps/web/app/index.css`.
2. **Global Layout (`AppShell`):** Replace flat Bootstrap top navbar with persistent desktop sidebar navigation + mobile offcanvas drawer.
3. **Design System Component Library:** Implement `ScoreRing`, `EvidenceBadge`, `SkillBadge`, `StatusBadge`, `EmptyState`, and `LoadingSkeleton`.

### Phase B: P0 Core Screens Refinement (Days 4–7)

4. **Dashboard Command Center (`/dashboard`):** Transform into high-impact command center with live readiness dial and action queues.
5. **Career Twin (`/career`):** Unify tabs (Experiences, Projects, Skills) with clear add/edit modals and verification markers.
6. **Resume Workspace & Analysis (`/resumes`, `/resumes/:id/analysis`):** Implement deep ATS scoring and Career Twin cross-checking.
7. **Job DNA & Match Matrix (`/jobs/:id`, `/jobs/:id/match/:matchId`):** Render required vs preferred skill clusters and comparison table.
8. **AI Resume Tailoring (`/resumes/:id/tailor/:jobId`):** Implement split-screen diff review canvas with strict Evidence Guard badges.

### Phase C: P1 Growth & CRM Polish (Days 8–10)

9. **Applications CRM (`/applications`):** Build interactive Kanban board with status updates and timeline event logging.
10. **Interview Simulation (`/interviews`, `/interviews/:id/mock`):** Polish mock question simulator and STAR evaluation cards.
11. **Career Analytics & Skill Gaps (`/analytics`, `/analytics/skills`):** Render readiness trends and prioritized gap lists with learning plan triggers.
12. **Learning Plans (`/learning`, `/learning/:id`):** Implement goal/task checklist with proof-of-work completion hooks.

### Phase D: P2 Integrations & Hardening (Days 11–12)

13. **GitHub Evidence Hub (`/integrations/github`, `/github/repositories`):** Polish repository browser and one-click Career Twin import.
14. **Google Calendar Integration (`/integrations/google-calendar`):** Connect status indicator and mock interview scheduling.
15. **Full WCAG 2.2 AA Accessibility & Cross-Browser Verification.**

---

_Specification Approved for Implementation across `apps/web`._
