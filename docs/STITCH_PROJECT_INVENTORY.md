# Resumind — Google Stitch Project Screen & Design Inventory

**Project ID:** `13898246341962442915`  
**Project URL:** [https://stitch.withgoogle.com/projects/13898246341962442915](https://stitch.withgoogle.com/projects/13898246341962442915)  
**Project Title:** Natural Style Web Suite / Resumind Studio  
**Visibility:** `PRIVATE`  
**Device Target:** `DESKTOP` (with responsive viewports across Laptop 1280px, Tablet 768px, Mobile 390px)  
**Design Theme:** `DARK`, Font: `INTER`, Monospace / Metrics: `JETBRAINS_MONO`, Roundness: `ROUND_FOUR` (`roundedness: 1`), Accent: `#3b82f6` (Electric Blue)  
**Stitch Integration Status:** **VERIFIED ACTIVE** via Antigravity Stitch MCP (`get_project`, `list_screens`, `get_screen`).

---

## 1. Project Metadata & Theme Overview

- **Project Resource Name:** `projects/13898246341962442915`
- **Project Type:** `TEXT_TO_UI_PRO`
- **Origin:** `STITCH`
- **Thumbnail Screenshot:** `projects/13898246341962442915/screens/15ec1857e1cf4f12a69e6b14a8537a5d/fileEntries/screenshot`
- **Color Mode:** `DARK`
- **Font Stack:**
  - Headline Font: `Inter`
  - Body Font: `Inter`
  - Label / Metrics Font: `JetBrains Mono`
- **Surface Tones:**
  - `canvas-base`: `#090D16` (Foundation viewport background)
  - `surface-subtle`: `#0B1120` (Inset panels, gutters, diff containers)
  - `surface-base`: `#0F172A` (Primary cards and layout container surface)
  - `surface-raised`: `#141E33` (Elevated cards, active tabs, hover states)
  - `surface-overlay`: `#1E293B` (Dialogs, flyout drawers, dropdowns)
- **Border System:**
  - `border-subtle`: `#1E293B` (Hairline section delineators)
  - `border-default`: `#2A374D` (Card boundaries, table dividers)
  - `border-emphasis`: `#3B4D6B` (Interactive states and active inputs)
- **Evidence Guard Triad:**
  - `VERIFIED`: Background `rgba(16, 185, 129, 0.12)`, Border `#10B981`, Text `#34D399`
  - `NEEDS_REVIEW`: Background `rgba(245, 158, 11, 0.12)`, Border `#F59E0B`, Text `#FBBF24`
  - `UNSUPPORTED`: Background `rgba(239, 68, 68, 0.12)`, Border `#EF4444`, Text `#F87171`

---

## 2. Complete Screen & Artifact Inventory

The Stitch project contains **14 screens and embedded design artifacts**. Below is the exhaustive inventory accounting for every item retrieved via Stitch MCP.

| # | Screen ID | Title | Canvas Dimensions | Screen Role / Archetype | Route Mapping |
|---|---|---|---|---|---|
| 01 | `4d9a6420d52c49faa00ff3be67798a78` | **Resumind — Dashboard Command Center** | 2560 × 2664 | Standalone Command Hub | `/dashboard` |
| 02 | `3e566915eb15426c91515e358ea15f44` | **Dashboard — Command Center (Variant)** | 2560 × 3288 | Standalone Command Hub | `/dashboard` |
| 03 | `0cef12bbbe6147a3b03244b655028ae7` | **Resumind — Career Twin Workspace** | 2560 × 3110 | Complex CRUD Workspace | `/career` |
| 04 | `c905607b79f64ec3a87b989fe02cdd35` | **Career Twin — Ground Truth Architecture** | 2560 × 2472 | Complex CRUD Workspace | `/career` |
| 05 | `15ec1857e1cf4f12a69e6b14a8537a5d` | **Resumind — Resume Intelligence & ATS Diagnostics** | 2560 × 3372 | Analytics & Detail View | `/resumes`, `/resumes/:id/analysis` |
| 06 | `98268ee6a86a4d28843da2e142b73963` | **Resumind — Job DNA & Match Matrix** | 2560 × 3442 | Detail & Match Diagnostic | `/jobs`, `/jobs/:id`, `/jobs/:id/match/:matchId` |
| 07 | `c9d69eb99b0a4fc9bed0a71b7780a5e7` | **Job DNA & Match Matrix (Variant)** | 2560 × 3210 | Detail & Match Diagnostic | `/jobs/:id` |
| 08 | `06eb92605b004f6fbf27ed8dfc1260f4` | **Resumind — AI Resume Tailoring Workspace** | 2560 × 2048 | Split-Screen Diff Workspace | `/resumes/:id/tailor/:jobId` |
| 09 | `8785fb74d33148738630c157182cde15` | **AI Resume Tailoring — Evidence Guard Review** | 2560 × 3504 | Split-Screen Diff Workspace | `/resumes/:id/tailor/:jobId` |
| 10 | `f9d1f34aa0534d1da71fefe615c02300` | **Resumind — Applications Pipeline CRM** | 2560 × 2048 | 6-Stage Kanban & List Board | `/applications`, `/applications/:id` |
| 11 | `8a8c8379fb5a4828863366eeeb956c48` | **Resumind — Interview Intelligence & Mock Simulation** | 2560 × 2490 | Interactive Practice & Report | `/interviews`, `/interviews/:id/mock`, `/interviews/:id/report` |
| 12 | `7618ef35b6c74a94b9a7708ecad803e3` | **Resumind — Career Velocity & Analytics** | 2560 × 3220 | Multi-Panel Analytics Hub | `/analytics`, `/analytics/skills`, `/learning` |
| 13 | `16136683198137398261` | **STITCH_FRONTEND_DESIGN_SPEC.md** | 780 × 1768 | Design Spec Document | Embedded Design Spec (`docs/STITCH_FRONTEND_DESIGN_SPEC.md`) |
| 14 | `16136683198137400871` | **FRONTEND_API_SCREEN_MAP.md** | 780 × 1768 | Contractual Map Document | Embedded Contract Map (`docs/FRONTEND_API_SCREEN_MAP.md`) |

---

## 3. Detailed Screen Breakdown & Hierarchy

### Screen 01 & 02: Dashboard Command Center
- **Identifiers:** `4d9a6420d52c49faa00ff3be67798a78`, `3e566915eb15426c91515e358ea15f44`
- **Archetype:** Standalone Page / Command Hub
- **Component Hierarchy:**
  - `AppNavbar` (Brand logo, quick links, active user avatar, navigation pills)
  - `CommandHeader` (Candidate greeting, active role target, global readiness score badge)
  - `HeroReadinessCard` (ScoreRing radial gauge: 0-100, ATS health summary, quick improve CTA)
  - `MetricStatGrid` (4 high-density metric cards: Resumes, Target Jobs, CRM Pipeline, Mock Interviews)
  - `CareerReadinessSection` (Live readiness breakdown: Skills, Experience, Projects, Proof of Work)
  - `PrioritizedSkillGapsPreview` (Top missing skills with priority pills and "Generate Plan" action)
  - `ActiveLearningRoadmapCard` (Current learning plan progress bar, next milestone task)
  - `RecentActivityFeed` (Timeline of recent applications, tailoring sessions, interview scores)
- **Responsive Handling:** Desktop 4-column cards reflow to 2-column on tablet (768px) and 1-column stack on mobile (390px).

### Screen 03 & 04: Career Twin Ground Truth Workspace
- **Identifiers:** `0cef12bbbe6147a3b03244b655028ae7`, `c905607b79f64ec3a87b989fe02cdd35`
- **Archetype:** Complex CRUD Workspace / Standalone Multi-tab Page
- **Component Hierarchy:**
  - `ProfileHeaderCard` (Full name, target role headline, career summary editor, level badge)
  - `CareerNavigationTabs` (Experience, Education, Projects, Skills, Certifications, Achievements)
  - `ExperienceSection` (Company, role, dates, bullet point list, verification indicators)
  - `EducationSection` (Institution, degree, field of study, graduation year, GPA)
  - `ProjectPortfolio` (Repository links, live URLs, technology badges, evidence provenance)
  - `SkillInventory` (Categorized skill chips: Languages, Frontend, Backend, Databases, DevOps, Tools)
  - `EntityMutationModals` (Accessible Add/Edit/Delete dialogs for all 7 Career Twin entity types)
- **Responsive Handling:** Sidebar tabs collapse to horizontal scrollable pill bar on tablet/mobile.

### Screen 05: Resume Intelligence & ATS Diagnostics
- **Identifier:** `15ec1857e1cf4f12a69e6b14a8537a5d`
- **Archetype:** Detail Page & Diagnostic Analyzer
- **Component Hierarchy:**
  - `ResumeHeader` (Document name, status pill, upload date, download / re-analyze CTAs)
  - `ATSSummaryCard` (ATS Readiness Score gauge, formatting score, keyword match percentage)
  - `SectionDiagnosticBars` (Progress breakdown: Contact Info, Work History, Skills, Education)
  - `GeminiFeedbackSection` (Actionable strengths, weaknesses, formatting risks, missing metrics)
  - `ResumeVersionHistory` (Immutable version list: V1 Base, V2 Tailored with provenance links)
  - `TwinComparisonDrawer` (Discrepancy audit comparing resume claims against Career Twin truth)
- **Responsive Handling:** Two-column split layout collapses to vertical cascade on viewports < 1024px.

### Screen 06 & 07: Job DNA & Match Matrix
- **Identifiers:** `98268ee6a86a4d28843da2e142b73963`, `c9d69eb99b0a4fc9bed0a71b7780a5e7`
- **Archetype:** Detail Page & Comparative Analysis
- **Component Hierarchy:**
  - `JobOverviewCard` (Job title, company, location, employment type, salary benchmark)
  - `MatchScoreGauge` (Overall fit percentage, Strong vs Partial vs Missing summary)
  - `RequiredVsPreferredSkills` (Distinct semantic sections preventing skill blurring)
  - `MatchBreakdownTable` (Skill name, candidate status: Verified / Needs Evidence / Missing, match tier)
  - `TailorResumeCTA` (Primary action routing directly to AI Tailoring workspace with job context)
- **Responsive Handling:** Match matrix table converts to stacked card list on mobile screens.

### Screen 08 & 09: AI Resume Tailoring & Evidence Guard Review
- **Identifiers:** `06eb92605b004f6fbf27ed8dfc1260f4`, `8785fb74d33148738630c157182cde15`
- **Archetype:** Split-Screen Diff Workspace
- **Component Hierarchy:**
  - `TailoringHeader` (Target job context, resume baseline, review progress counter: e.g. 2/3 reviewed)
  - `DiffReviewCards` (Side-by-side or stacked diff: Original text vs Suggested text)
  - `EvidenceGuardBadge` (Prominent verification badge: `VERIFIED`, `NEEDS_REVIEW`, `UNSUPPORTED`)
  - `ActionControls` (Inline Accept / Reject buttons, edit suggestion textarea)
  - `CompletionDrawer` ("Finalize & Generate Resume Version" modal with immutability notice)
- **Responsive Handling:** Split 50/50 desktop columns convert to stacked Original-above-Suggested cards on mobile.

### Screen 10: Applications Pipeline CRM
- **Identifier:** `f9d1f34aa0534d1da71fefe615c02300`
- **Archetype:** Kanban Board & List CRM
- **Component Hierarchy:**
  - `PipelineMetricsBar` (Total applications, active stages, interview conversion rate, offer count)
  - `ViewToggle` (Switch between Kanban Board and Tabular List view)
  - `KanbanColumns` (6 stages: Saved, Applied, Assessment, Interview, Offer, Rejected)
  - `ApplicationCard` (Company, role, salary, days in stage, linked resume version pill, action menu)
  - `ApplicationDetailDrawer` (Event timeline, recruiter contact notes, interview reminders)
- **Responsive Handling:** Kanban board enables horizontal scroll with sticky stage headers on touch devices.

### Screen 11: Interview Intelligence & Mock Simulation
- **Identifier:** `8a8c8379fb5a4828863366eeeb956c48`
- **Archetype:** Interactive Practice & Session Report
- **Component Hierarchy:**
  - `InterviewSetupCard` (Target role selection, difficulty level, STAR question generator)
  - `QuestionCarousel` (Question prompt, STAR framework helper hints, response input)
  - `AnswerEvaluationPanel` (Real-time AI evaluation: Situation, Task, Action, Result scores)
  - `SessionReportCard` (Overall score gauge, strengths, areas for improvement, model answers)
- **Responsive Handling:** Full-width responsive container maintaining readable line lengths (< 72ch).

### Screen 12: Career Velocity & Analytics
- **Identifier:** `7618ef35b6c74a94b9a7708ecad803e3`
- **Archetype:** Multi-Panel Analytics & Upskilling Hub
- **Component Hierarchy:**
  - `ReadinessTrendChart` (Historical readiness score progression over time)
  - `SkillGapPrioritizationList` (High-demand missing skills sorted by market relevance)
  - `LearningPlanIntegration` (Active learning goals, task checklist, proof-of-work submission)
  - `MarketBenchmarkCard` (Role trajectory match percentages across tech stack profiles)
- **Responsive Handling:** 12-column grid adapts to 6-column on tablet and 12-column stacked on mobile.

---

## 4. Design Artifacts & Specifications
- `16136683198137398261` (`STITCH_FRONTEND_DESIGN_SPEC.md`): Detailed component anatomy, CSS token definitions, accessibility standards, and interaction guidelines.
- `16136683198137400871` (`FRONTEND_API_SCREEN_MAP.md`): End-to-end mapping from Stitch screen components to Express REST endpoints, Prisma models, request schemas, and response envelopes.
