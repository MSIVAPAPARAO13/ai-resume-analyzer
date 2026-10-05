# Phase 6 — Application CRM & GitHub Career Evidence Walkthrough

## Executive Summary

Phase 6 introduces two interconnected pillars to Resumind:

1. **Application CRM**: An end-to-end job application lifecycle management system featuring Kanban status boards, chronological audit event timelines, resume version linking, follow-up scheduling, and descriptive CRM analytics.
2. **GitHub Career Evidence**: A secure, provider-abstracted integration connecting GitHub developer activity directly into the Career Twin and Evidence Guard without exposing tokens or automatically overwriting verified claims.

The complete career advancement loop is now fulfilled:
$$\text{Job Discovery} \longrightarrow \text{Job DNA} \longrightarrow \text{Resume Match} \longrightarrow \text{AI Tailoring} \longrightarrow \text{Apply} \longrightarrow \text{Application CRM} \longrightarrow \text{Interview} \longrightarrow \text{Offer}$$
and evidence flows from:
$$\text{GitHub} \longrightarrow \text{Repositories} \longrightarrow \text{Project Evidence} \longrightarrow \text{User Approval} \longrightarrow \text{Career Twin} \longrightarrow \text{Evidence Guard}$$

---

## 1. Application CRM Architecture

### 1.1 Database Models & Relations

The Application CRM is modeled declaratively in Prisma (`apps/api/prisma/schema.prisma`):

```prisma
enum ApplicationStatus {
  SAVED
  APPLIED
  ASSESSMENT
  INTERVIEW
  OFFER
  REJECTED
  WITHDRAWN
}

enum ApplicationEventType {
  CREATED
  APPLIED
  ASSESSMENT
  INTERVIEW
  FOLLOW_UP
  OFFER
  REJECTED
  WITHDRAWN
  NOTE
}

model Application {
  id                  String             @id @default(uuid())
  userId              String             @map("user_id")
  jobId               String?            @map("job_id")
  resumeVersionId     String?            @map("resume_version_id")
  tailoringSessionId  String?            @map("tailoring_session_id")
  company             String
  role                String
  jobUrl              String?            @map("job_url")
  status              ApplicationStatus  @default(SAVED)
  appliedAt           DateTime?          @map("applied_at")
  followUpAt          DateTime?          @map("follow_up_at")
  recruiterName       String?            @map("recruiter_name")
  recruiterEmail      String?            @map("recruiter_email")
  notes               String?
  createdAt           DateTime           @default(now()) @map("created_at")
  updatedAt           DateTime           @updatedAt @map("updated_at")

  user                User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  job                 Job?                    @relation(fields: [jobId], references: [id], onDelete: SetNull)
  resumeVersion       ResumeVersion?          @relation(fields: [resumeVersionId], references: [id], onDelete: SetNull)
  tailoringSession    ResumeTailoringSession? @relation(fields: [tailoringSessionId], references: [id], onDelete: SetNull)
  events              ApplicationEvent[]

  @@index([userId, status])
  @@index([userId, createdAt])
  @@map("applications")
}

model ApplicationEvent {
  id            String               @id @default(uuid())
  applicationId String               @map("application_id")
  type          ApplicationEventType
  description   String
  eventDate     DateTime             @default(now()) @map("event_date")
  metadata      Json?
  createdAt     DateTime             @default(now()) @map("created_at")

  application   Application          @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([applicationId, eventDate])
  @@map("application_events")
}
```

### 1.2 Status Lifecycle & Audit Timeline

- **Explicit Transitions**: Supported statuses follow `SAVED` $\to$ `APPLIED` $\to$ `ASSESSMENT` $\to$ `INTERVIEW` $\to$ `OFFER` / `REJECTED` / `WITHDRAWN`.
- **Automatic Event Recording**: When an application is created or its status changed via `PATCH /api/v1/applications/:id/status`, a corresponding `ApplicationEvent` is automatically appended to ensure audit integrity.
- **Custom Event Logging**: Users can log milestones and meeting notes (`NOTE`, `INTERVIEW`, `ASSESSMENT`, `FOLLOW_UP`) directly to the timeline via `POST /api/v1/applications/:id/events`.
- **Follow-up Reminders**: Explicit date selection (`followUpAt`) highlighted prominently in both the Kanban cards and application detail hero view.

### 1.3 Historical Resume Version & Tailoring Linkage

- Preserves the exact `resumeVersionId` submitted with each application.
- If generated through an AI Tailoring session, optionally references `tailoringSessionId`.
- Eliminates ambiguity over which resume snapshot was shared with prospective employers.

### 1.4 Descriptive Application Analytics

Computes transparent CRM funnel metrics via `GET /api/v1/applications/analytics`:

- **Total Applications** and per-stage breakdown.
- **Application $\to$ Interview Rate**: $\frac{\text{Interviews}}{\text{Applications}} \times 100\%$.
- **Offer Rate**: $\frac{\text{Offers}}{\text{Applications}} \times 100\%$.
- **Average Match Score**: Mean score computed across applications linked to calculated job matches.
- **Resume Version Usage**: Frequency breakdown of resume versions deployed across all submissions.

---

## 2. GitHub Career Evidence Architecture

### 2.1 Provider Abstraction & Security

Resumind implements an extensible provider interface (`apps/api/src/modules/github/github.interface.ts`):

- `GitHubProvider` handles real GitHub REST API v3 operations.
- `MockGitHubProvider` provides offline, deterministic testing with mock repositories, language distributions, and README metadata.
- **Fine-grained User Authorization**: Follows standard OAuth 2.0 Web Flow with signed HMAC SHA-256 state parameters to prevent CSRF attacks.

### 2.2 Token Protection & AES-256-GCM Encryption

To prevent token leakage:

- Tokens are encrypted server-side using **AES-256-GCM** authenticated encryption (`iv:authTag:ciphertext`).
- Stored securely in `github_connections` table.
- **Zero Frontend Leakage**: Access tokens, refresh tokens, and encryption keys are strictly omitted from API responses, serialized state, and application logs.

```prisma
model GitHubConnection {
  id                      String    @id @default(uuid())
  userId                  String    @unique @map("user_id")
  githubUserId            String    @map("github_user_id")
  username                String
  avatarUrl               String?   @map("avatar_url")
  accessTokenEncrypted    String    @map("access_token_encrypted")
  refreshTokenEncrypted   String?   @map("refresh_token_encrypted")
  accessTokenExpiresAt    DateTime? @map("access_token_expires_at")
  refreshTokenExpiresAt   DateTime? @map("refresh_token_expires_at")
  createdAt               DateTime  @default(now()) @map("created_at")
  updatedAt               DateTime  @updatedAt @map("updated_at")

  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("github_connections")
}
```

### 2.3 Evidence Guard Integration & Distinction

GitHub metadata is isolated as an **`EXTERNAL_SOURCE`** until explicitly reviewed and approved by the user:

- `Source: GitHub` $\longrightarrow$ `EXTERNAL_SOURCE` (requires user verification before claiming).
- `Source: Career Twin` $\longrightarrow$ `VERIFIED_USER_DATA`.
- Prevents unvetted README claims from silently altering resume tailoring suggestions or match qualifications.

### 2.4 User-Approved Career Twin Import Flow

1. User reviews repository metadata, detected languages, and extracted technologies.
2. User can edit the project title, description, and technologies inside a review modal.
3. Upon confirmation, a verified `Project` record is persisted to the user's `CareerProfile`.

---

## 3. API Endpoints

### 3.1 Application CRM (`/api/v1/applications`)

| Method   | Endpoint                          | Description                                        |
| -------- | --------------------------------- | -------------------------------------------------- |
| `POST`   | `/api/v1/applications`            | Create application (from job, Adzuna, or manual)   |
| `GET`    | `/api/v1/applications`            | List user applications with filters & search       |
| `GET`    | `/api/v1/applications/analytics`  | Retrieve CRM funnel metrics & version usage        |
| `GET`    | `/api/v1/applications/:id`        | Get application details, job, resume, and timeline |
| `PUT`    | `/api/v1/applications/:id`        | Update application details & notes                 |
| `PATCH`  | `/api/v1/applications/:id/status` | Update status & record automatic timeline event    |
| `DELETE` | `/api/v1/applications/:id`        | Delete application & cascade events                |
| `GET`    | `/api/v1/applications/:id/events` | List chronological timeline events                 |
| `POST`   | `/api/v1/applications/:id/events` | Add manual event or milestone                      |

### 3.2 GitHub Integration (`/api/v1/github`)

| Method | Endpoint                                    | Description                                              |
| ------ | ------------------------------------------- | -------------------------------------------------------- |
| `GET`  | `/api/v1/github/connect`                    | Generate GitHub authorization URL with signed HMAC state |
| `GET`  | `/api/v1/github/callback`                   | Exchange OAuth code, encrypt token, & sync metadata      |
| `POST` | `/api/v1/github/disconnect`                 | Disconnect GitHub account and purge stored tokens        |
| `GET`  | `/api/v1/github/me`                         | Check connection status, username, & repository count    |
| `GET`  | `/api/v1/github/repositories`               | List synced repositories with filtering & pagination     |
| `POST` | `/api/v1/github/repositories/sync`          | Manually refresh repository cache from GitHub API        |
| `GET`  | `/api/v1/github/repositories/:id`           | Get repository details                                   |
| `GET`  | `/api/v1/github/repositories/:id/languages` | Get language byte distribution                           |
| `GET`  | `/api/v1/github/repositories/:id/readme`    | Fetch sanitized README & detected technologies           |
| `POST` | `/api/v1/github/repositories/:id/import`    | User-approved project import into Career Twin            |

---

## 4. Environment Configuration

The following variables must be configured in `apps/api/.env` (actual secret values are never committed):

```env
# GitHub App / OAuth Integration (Phase 6)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:4000/api/v1/github/callback
GITHUB_ENCRYPTION_KEY=32_character_hex_encryption_key_here
```

---

## 5. Verification & Test Results

### 5.1 Test Suites Summary

- **Backend Integration Tests**:
  - `phase6-crm-github.test.ts`: **23/23 tests PASSED**.
  - All test files across API: **8 passed, 127 tests passed, 0 failures**.
- **Type Checking**:
  - `npm run typecheck`: **0 errors**.
- **Linting & Code Style**:
  - `npm run lint`: **0 errors, 0 warnings**.
  - `npm run format:check`: **All files matched Prettier code style**.
- **Production Builds**:
  - `npm run build`: Built client & SSR environments cleanly with React Router & Vite.
- **End-to-End Playwright Tests**:
  - `tests/e2e/phase6-crm-github.spec.ts`: **PASSED**.
  - `tests/e2e/application-crm.spec.ts`: **PASSED**.

---

## 6. Strict Phase Boundary & Out of Scope for Phase 6

As mandated:

- **No Google Calendar or Email Notifications**: Reminders are strictly date-based storage.
- **No Interview Scheduling**: Scheduled for Phase 7 (Interview Intelligence & Interview Preparation).
- **No Additional AI / Job Providers**: Gemini, MockAI, and Adzuna are preserved.
- **No Vector DBs / RAG / Kafka / Microservices**: Resumind maintains its clean, high-performance modular monolith architecture.
