# Resumind — Interactive Element & UI Action Audit

**Specification Reference:** Phase 6 — Test Every Button, Control, and Form  
**Status:** **AUDITED & VERIFIED**

---

## 1. Global Interactive Element Inventory

| Page | Element | Expected Behavior | API / Action | Test Result | Fix / Status |
|---|---|---|---|---|---|
| `/login` | `#email` | Accepts email input | State update | **PASS** | Validated |
| `/login` | `#password` | Accepts masked password | State update | **PASS** | Validated |
| `/login` | `#login-submit` | Authenticates user & redirects to `/dashboard` | `POST /api/v1/auth/login` | **PASS** | Calibrated rate limit |
| `/register` | `#register-name` | Accepts candidate full name | State update | **PASS** | Validated |
| `/register` | `#register-email` | Validates email syntax | State update | **PASS** | Validated |
| `/register` | `#register-password`| Enforces password strength rules | State update | **PASS** | Validated |
| `/register` | `#register-submit`| Creates account & logs in | `POST /api/v1/auth/register` | **PASS** | Validated |
| `/dashboard` | `#nav-career` | Navigates to Career Twin | Client route `/career` | **PASS** | Validated |
| `/dashboard` | `#nav-resumes` | Navigates to Resume Intelligence | Client route `/resumes` | **PASS** | Validated |
| `/dashboard` | `#nav-jobs` | Navigates to Job DNA explorer | Client route `/jobs` | **PASS** | Validated |
| `/dashboard` | `#nav-applications`| Navigates to Applications CRM | Client route `/applications` | **PASS** | Validated |
| `/dashboard` | `#nav-interviews`| Navigates to Mock Interviews | Client route `/interviews` | **PASS** | Validated |
| `/dashboard` | `#nav-analytics`| Navigates to Career Velocity | Client route `/analytics` | **PASS** | Validated |
| `/dashboard` | `#nav-learning` | Navigates to Learning Plans | Client route `/learning` | **PASS** | Validated |
| `/dashboard` | `Improve Resume CTA` | Deep links to target resume | `/resumes` | **PASS** | Validated |
| `/dashboard` | `Analyze Job CTA` | Deep links to job matching | `/jobs` | **PASS** | Validated |
| `/career` | `Tabs (Experience, Education, ...)` | Switches entity category tab | Local state `activeSection` | **PASS** | Validated |
| `/career` | `#profile-target-role`| Edits candidate target role | `PUT /api/v1/profile` | **PASS** | Form key bound & accessible |
| `/career` | `Save Profile Button` | Persists career profile | `PUT /api/v1/profile` | **PASS** | Validated |
| `/career` | `Add Experience Button` | Opens modal for work history | `POST /api/v1/experiences` | **PASS** | Validated |
| `/career` | `Delete Skill Button` | Removes verified skill tag | `DELETE /api/v1/skills/:id` | **PASS** | Validated |
| `/resumes` | `#resume-file-input` | Accepts PDF/DOCX file selection | Multipart form | **PASS** | Validated |
| `/resumes` | `Upload Button` | Uploads & parses document | `POST /api/v1/resumes` | **PASS** | Validated |
| `/resumes` | `Analyze Resume Link` | Navigates to ATS diagnostics | `/resumes/:id/analysis` | **PASS** | Array response normalized |
| `/jobs` | `+ Add Target Job` | Opens job description modal | `POST /api/v1/jobs` | **PASS** | Validated |
| `/jobs` | `Analyze DNA Button`| Triggers semantic requirement extraction | `POST /api/v1/jobs/:id/analyze` | **PASS** | Validated |
| `/jobs` | `Match Resume Button`| Evaluates resume vs Job DNA | `POST /api/v1/jobs/:id/match/:resumeId` | **PASS** | Array unwrap guarded |
| `/applications`| `Kanban Stage Dropdown` | Moves application stage | `PATCH /api/v1/applications/:id/status` | **PASS** | Validated |
| `/applications`| `Add Timeline Event` | Records interview / recruiter touchpoint | `POST /api/v1/applications/:id/events` | **PASS** | Validated |
| `/interviews` | `Generate Questions`| Generates role-specific STAR questions | `POST /api/v1/interviews/:id/generate-questions` | **PASS** | Validated |
| `/interviews` | `Submit Answer` | Evaluates STAR answer against evidence | `POST /api/v1/interviews/:id/questions/:qId/evaluate` | **PASS** | Validated |
| `/integrations/google-calendar` | `Connect Calendar` | Initiates signed OAuth authorization | `GET /api/v1/calendar/connect` | **PASS** | Mock auth URL fixed |
| `/integrations/google-calendar` | `Disconnect` | Revokes credentials & deletes relation | `POST /api/v1/calendar/disconnect` | **PASS** | Validated |
| `/learning` | `View Plan Details` | Opens curriculum checklist | `/learning/:id` | **PASS** | Validated |
| `/learning/:id`| `Complete Task Checkbox` | Toggles milestone task completion | `PATCH /api/v1/learning-plans/tasks/:id/status` | **PASS** | Validated |
| `AppNavbar` | `Sign Out Button` | Revokes refresh token & clears storage | `POST /api/v1/auth/logout` | **PASS** | Validated |
