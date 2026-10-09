# Phase 7 — Interview Intelligence & Interview Preparation

## Executive Summary

Phase 7 builds a personalized, evidence-grounded interview preparation and simulation engine for Resumind. It links the user's **Career Twin**, **Selected Resume Version**, **Job DNA**, **Resume ↔ Job Match**, **Evidence Guard**, **Tailoring Provenance**, and **Application CRM Context** to deliver actionable, role-specific interview readiness.

### Key Guarantees

- **Strict Evidence Guard Grounding**: The AI never invents work experience, employers, metrics, credentials, or technologies. Questions referencing user background cite exact Career Twin or Resume evidence references. Missing requirements are framed as discovery/learning questions without pretending the candidate already possesses unverified skills.
- **STAR-Method Evaluation**: AI-assisted answer evaluation scores candidate responses across relevance, completeness, clarity, technical depth, and evidence alignment without declaring itself an objective hiring authority.
- **Interactive Mock Interview Simulation**: Step-by-step interview experience tracking live session progress, timer, per-question draft/submit/evaluate actions, and synthesizing a comprehensive final readiness report.
- **Enterprise-Grade Integrations**: Server-side Google Calendar OAuth with AES-256-GCM encrypted tokens and HMAC-signed state for scheduling, paired with decoupled Resend transactional email notifications.
- **Design & UI**: Bootstrap 5 dark-mode interface with zero Tailwind CSS dependencies.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │    Career Twin + Resume Version       │
                      │   + Job DNA + ResumeJobMatch Data     │
                      └──────────────────┬────────────────────┘
                                         │
                                         ▼
                      ┌───────────────────────────────────────┐
                      │      Interview Preparation Engine     │
                      │  (interview.service.ts + Zod Schemas) │
                      └──────┬─────────────────────────┬──────┘
                             │                         │
            ┌────────────────┴───────────────┐         │
            ▼                                ▼         ▼
┌───────────────────────┐        ┌───────────────────────┐
│     AIProvider        │        │   Evidence Guard      │
│ ├─ MockAIProvider     │        │ ├─ VERIFIED_USER_DATA │
│ ├─ GeminiProvider     │        │ ├─ EXTERNAL_SOURCE    │
│ └─ OpenRouterProvider │        │ ├─ NEEDS_REVIEW       │
└───────────────────────┘        │ └─ UNSUPPORTED        │
                                 └───────────────────────┘
            │
            ├───────────────┬─────────────────┐
            ▼               ▼                 ▼
┌──────────────────┐ ┌────────────────┐ ┌────────────────┐
│ InterviewSession │ │ CalendarProvider│ │ EmailProvider  │
│ ├─ Questions     │ │ ├─ Google GCal │ │ ├─ Resend      │
│ └─ Answers       │ │ └─ MockCalendar│ │ └─ MockEmail   │
└──────────────────┘ └────────────────┘ └────────────────┘
```

---

## Database Models & Schema Extensions

### 1. `InterviewSession`

Belongs to a single `User`. Optionally links to `Application`, `Job`, `ResumeVersion`, and `ResumeTailoringSession`.

- `id`: UUID (Primary Key)
- `userId`: Foreign key to `User` (Cascade delete)
- `applicationId`: Optional FK to `Application` (SetNull on delete)
- `jobId`: Optional FK to `Job` (SetNull on delete)
- `resumeVersionId`: Optional FK to `ResumeVersion` (SetNull on delete)
- `tailoringSessionId`: Optional FK to `ResumeTailoringSession` (SetNull on delete)
- `title`: String
- `mode`: Enum (`PREPARATION`, `MOCK_INTERVIEW`)
- `status`: Enum (`DRAFT`, `IN_PROGRESS`, `COMPLETED`, `ABANDONED`)
- `difficulty`: Enum (`EASY`, `MEDIUM`, `HARD`)
- `startedAt`: DateTime
- `completedAt`: DateTime nullable
- `overallScore`: Float nullable
- `metadata`: Json nullable

### 2. `InterviewQuestion`

Belongs to an `InterviewSession`.

- `id`: UUID (Primary Key)
- `sessionId`: Foreign key to `InterviewSession` (Cascade delete)
- `category`: Enum (`RESUME`, `CAREER_TWIN`, `PROJECT`, `TECHNICAL`, `JOB_SPECIFIC`, `BEHAVIORAL`, `SITUATIONAL`, `COMPANY_ROLE`, `EXPERIENCE`)
- `difficulty`: Enum (`EASY`, `MEDIUM`, `HARD`)
- `question`: String
- `whyAsked`: String (rationale grounded in requirements or profile)
- `expectedSignals`: Array of strings
- `evidenceReferences`: Json array (storing `{ source, type, referenceId, label }`)
- `preparationTips`: Array of strings
- `orderIndex`: Integer

### 3. `InterviewAnswer`

Belongs to an `InterviewQuestion`. Preserves user answers and evaluation history.

- `id`: UUID (Primary Key)
- `questionId`: Foreign key to `InterviewQuestion` (Cascade delete)
- `answerText`: Text
- `submittedAt`: DateTime
- `score`: Float nullable (0–100)
- `strengths`: Array of strings
- `weaknesses`: Array of strings
- `missingPoints`: Array of strings
- `improvementSuggestions`: Array of strings
- `evidenceAlignment`: String nullable
- `recommendedStructure`: Text nullable

### 4. `CalendarConnection`

Stores Google Calendar OAuth access and refresh tokens encrypted with AES-256-GCM.

- `id`: UUID (Primary Key)
- `userId`: Foreign key to `User` (Unique, Cascade delete)
- `provider`: String (e.g., `'GOOGLE'`)
- `accessToken`: String (ciphertext + IV + authTag)
- `refreshToken`: String nullable (ciphertext + IV + authTag)
- `expiresAt`: DateTime nullable
- `scope`: String nullable

### 5. `InterviewReminder`

Supports scheduled reminders (e.g., 24h, 1h before) for interview sessions.

- `id`: UUID (Primary Key)
- `userId`: Foreign key to `User`
- `sessionId`: Foreign key to `InterviewSession`
- `remindAt`: DateTime
- `emailSent`: Boolean (idempotency flag)
- `calendarCreated`: Boolean

---

## API Endpoints

All endpoints require JWT Bearer authentication and enforce tenant isolation (`userId` ownership), with the exception of the OAuth callback which verifies an HMAC-signed state token.

### Interview Preparation & Mock Sessions

| Method   | Path                                                    | Description                                              |
| -------- | ------------------------------------------------------- | -------------------------------------------------------- |
| `POST`   | `/api/v1/interviews`                                    | Create a new interview session (links to app/job/resume) |
| `GET`    | `/api/v1/interviews`                                    | List interview sessions for the authenticated user       |
| `GET`    | `/api/v1/interviews/:id`                                | Get interview session details and status                 |
| `PATCH`  | `/api/v1/interviews/:id`                                | Update session metadata (title, difficulty, status)      |
| `DELETE` | `/api/v1/interviews/:id`                                | Delete session and cascade delete questions/answers      |
| `POST`   | `/api/v1/interviews/:id/generate-questions`             | Generate grounded questions via AIProvider               |
| `GET`    | `/api/v1/interviews/:id/questions`                      | List ordered questions with evidence metadata            |
| `POST`   | `/api/v1/interviews/:id/questions/:questionId/answer`   | Save draft or submit an answer                           |
| `GET`    | `/api/v1/interviews/:id/questions/:questionId/answers`  | View submission and evaluation history                   |
| `POST`   | `/api/v1/interviews/:id/questions/:questionId/evaluate` | Evaluate answer with AI STAR feedback                    |
| `GET`    | `/api/v1/interviews/:id/prep-plan`                      | Retrieve 5-day prep plan and technical checklist         |
| `POST`   | `/api/v1/interviews/:id/complete`                       | Finalize session and trigger completion email            |
| `GET`    | `/api/v1/interviews/:id/report`                         | Generate/view comprehensive interview readiness report   |

### Google Calendar Integration

| Method | Path                                    | Description                                                    |
| ------ | --------------------------------------- | -------------------------------------------------------------- |
| `GET`  | `/api/v1/calendar/connect`              | Returns Google OAuth authorization URL with signed state       |
| `GET`  | `/api/v1/calendar/callback`             | OAuth redirect callback; stores AES-256-GCM encrypted tokens   |
| `GET`  | `/api/v1/calendar/status`               | Returns Google Calendar connection status                      |
| `POST` | `/api/v1/calendar/disconnect`           | Deletes user calendar connection tokens                        |
| `POST` | `/api/v1/interviews/:id/calendar-event` | Explicit user action to add interview event to Google Calendar |

---

## AI Provider Extensions & Grounding Guarantees

The `AIProvider` interface is extended with 4 strictly-validated methods:

1. `generateInterviewQuestions(params: GenerateInterviewQuestionsParams): Promise<InterviewQuestionGenerationResult>`
2. `evaluateInterviewAnswer(params: EvaluateAnswerParams): Promise<InterviewAnswerEvaluation>`
3. `generateInterviewPreparationPlan(params: GeneratePrepPlanParams): Promise<InterviewPreparationPlan>`
4. `generateInterviewFinalReport(params: GenerateFinalReportParams): Promise<InterviewFinalReport>`

### Deterministic Mock & Schema-Validated Gemini

- `MockAIProvider` provides reproducible, deterministic responses for all test suites.
- `GeminiProvider` generates strict structured JSON parsed against Zod schemas (`InterviewQuestionGenerationResultSchema`, `InterviewAnswerEvaluationSchema`, etc.).
- Robust error handling: Handles rate limits, quota exhaustion, and schema mismatches gracefully without leaking API keys or internal stack traces.

---

## Provider Abstractions

### Email Provider

- Interface: `EmailProvider` (`sendEmail(options): Promise<SendEmailResult>`)
- Implementations:
  - `MockEmailProvider`: In-memory recording of sent messages for deterministic testing.
  - `ResendEmailProvider`: Production delivery via the official Resend API using `RESEND_API_KEY`.
- Transactional templates:
  1. `interviewScheduled`: Sent upon scheduling an interview.
  2. `interviewReminder`: Sent 24h or 1h before interview.
  3. `interviewCompleted`: Sent with readiness score and category breakdown.

### Calendar Provider

- Interface: `CalendarProvider` (`getAuthUrl`, `exchangeCode`, `createEvent`, `revokeToken`)
- Implementations:
  - `MockCalendarProvider`: Deterministic state generation and event creation without live Google API calls.
  - `GoogleCalendarProvider`: OAuth2 client with minimal scope (`https://www.googleapis.com/auth/calendar.events`).

---

## Frontend Routes (Bootstrap 5, No Tailwind)

| Route                           | Component                          | Purpose                                                                   |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `/interviews`                   | `interviews.tsx`                   | Dashboard displaying upcoming sessions, stats, category readiness         |
| `/interviews/new`               | `interview-new.tsx`                | Create session with mode, difficulty, and CRM app linkage                 |
| `/interviews/:id`               | `interview-detail.tsx`             | Session overview, 5-day prep plan, technical checklist                    |
| `/interviews/:id/questions`     | `interview-questions.tsx`          | Question practice, evidence references, answer editor & STAR evaluation   |
| `/interviews/:id/mock`          | `interview-mock.tsx`               | Interactive step-by-step mock interview simulation with timer             |
| `/interviews/:id/report`        | `interview-report.tsx`             | Final readiness report, category radar, strongest/weakest areas, GCal CTA |
| `/integrations/google-calendar` | `integrations-google-calendar.tsx` | Google Calendar connection management with connect/disconnect actions     |

---

## Security Verification

1. **Authentication & Tenant Isolation**: Every interview, question, answer, and calendar resource verifies `session.userId === req.user.userId`. User 2 cannot access or mutate User 1 sessions.
2. **Token Encryption**: Google OAuth access and refresh tokens are encrypted at rest using AES-256-GCM with PBKDF2 key derivation.
3. **Signed State**: Calendar OAuth states are HMAC-SHA256 signed with random nonces and 15-minute expirations to prevent CSRF.
4. **Secret Protection**: API keys and encrypted secrets are stripped from API responses and excluded from server logs.

---

## Verification & Test Results

- **Prisma Validation**: Passed (`schema.prisma` is valid).
- **TypeScript Typecheck**: 0 errors across `@resumind/api` and `@resumind/web`.
- **ESLint**: 0 errors, 0 warnings.
- **Prettier**: Clean formatting across all files.
- **API Integration Tests**: 147 passed across 9 test suites (20/20 Phase 7 tests passed).
- **Production Build**: Successfully built `@resumind/web` and `@resumind/api`.
- **Playwright E2E**:
  - `tests/e2e/phase7-interview-intelligence.spec.ts`: Passed in 4.8s.
  - `tests/e2e/application-crm.spec.ts`: Passed in 6.6s.
