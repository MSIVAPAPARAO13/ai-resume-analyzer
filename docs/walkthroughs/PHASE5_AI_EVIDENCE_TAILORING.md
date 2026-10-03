# Phase 5: AI Intelligence, Evidence Guard, Resume Tailoring & Adzuna Job Discovery

**Canonical Repository**: [https://github.com/MSIVAPAPARAO13/ai-resume-analyzer](https://github.com/MSIVAPAPARAO13/ai-resume-analyzer)  
**Branch**: `feature/phase-5-ai-evidence-tailoring`  
**Status**: Verified Complete  

---

## 1. Executive Summary

Phase 5 introduces grounded AI intelligence and live job discovery into Resumind while strictly upholding anti-hallucination and security guarantees.

Four interconnected capabilities have been engineered and verified:
1. **Gemini AI Provider**: Official modern Google GenAI SDK (`@google/genai`) integration with structured JSON output and schema validation, preserving `MockAIProvider` for deterministic testing.
2. **Evidence Guard**: An anti-hallucination audit gate that cross-references AI suggestions against candidate Career Twin and resume evidence, classifying claims into `VERIFIED`, `NEEDS_REVIEW`, and `UNSUPPORTED`.
3. **AI Resume Tailoring Studio**: Job-specific resume tailoring with transparent diffs, per-suggestion Accept/Reject controls, and version creation preserving original baselines.
4. **Adzuna Job Discovery**: Live real-world job search through Adzuna, returning normalized `JobSearchResult` payloads with one-click import into Resumind.

```
Candidate Evidence                     Target Role
(Resume + Career Twin)                 (Job Description)
          │                                   │
          ▼                                   ▼
    [AI Provider] ────── (JSON Schema) ──> [Job DNA]
          │
          ▼
   [Evidence Guard] ──> (Audit: Metrics / Technologies / Roles)
          │
          ├── VERIFIED
          ├── NEEDS_REVIEW
          └── UNSUPPORTED
          │
          ▼
   [User Approval] ───> [Accept / Reject] ───> [New Resume Version]
```

---

## 2. Environment Configuration & Security Verification

### 2.1 Backend Environment Variables

The backend safely validates credentials via Zod in `apps/api/src/config/env.ts`:

```env
# Gemini AI Configuration
GEMINI_API_KEY=<configured-in-backend-env-only>

# Adzuna Job Discovery Configuration
ADZUNA_APP_ID=<configured-in-backend-env-only>
ADZUNA_APP_KEY=<configured-in-backend-env-only>

# Optional Real-Provider Integration Tests
RUN_EXTERNAL_AI_TESTS=false
RUN_EXTERNAL_PROVIDER_TESTS=false
```

### 2.2 Security Guarantees & Audit
- **Zero Frontend Leakage**: Neither `GEMINI_API_KEY` nor `ADZUNA_APP_ID`/`ADZUNA_APP_KEY` are prefixed with `VITE_` or exposed to the client bundle.
- **Git Ignore**: Verified that `.env`, `.env.*`, `**/.env`, and `uploads/` are completely excluded by `.gitignore`.
- **Zero Raw Provider Responses**: All responses from Gemini and Adzuna pass through normalization filters before returning to the frontend.
- **Tenant Isolation**: Users can only access, tailor, or import jobs and resumes that they own.

---

## 3. AI Provider Architecture

### 3.1 Interface Abstraction (`AIProvider`)

Located in `apps/api/src/modules/resume/ai/ai.interface.ts`:

```ts
export interface AIProvider {
  readonly name: string;
  analyzeResume(
    text: string,
    parsedData: ParsedResumeData,
    careerTwin?: any,
  ): Promise<AIAnalysisResult>;
  generateTailoringSuggestions(
    params: TailoringPromptParams,
  ): Promise<TailoringGenerationResult>;
}
```

### 3.2 Provider Implementations
- **`MockAIProvider`** (`apps/api/src/modules/resume/ai/mock-ai.provider.ts`):
  - Deterministic provider used for continuous integration, Playwright, and offline test environments.
  - Matches candidate skills and experience against Job DNA to produce structured suggestions without network calls.
- **`GeminiProvider`** (`apps/api/src/modules/resume/ai/gemini.provider.ts`):
  - Uses official Google GenAI SDK: `@google/genai`.
  - Configures `responseMimeType: 'application/json'` with structured system prompts.
  - Validates returned payloads using Zod schemas.
  - Gracefully converts network timeouts and rate limits into user-friendly application errors.
- **`getAIProvider(preferred?)`** (`apps/api/src/modules/resume/ai/ai.factory.ts`):
  - Resolves `GeminiProvider` when configured, defaulting to `MockAIProvider` for tests and local environments without keys.

---

## 4. Evidence Guard & Anti-Hallucination Gate

### 4.1 Anti-Hallucination Rules
Gemini and AI suggestions are **strictly forbidden** from inventing:
- Employers or educational institutions.
- Job titles or degrees.
- Technologies, frameworks, or libraries absent from candidate evidence.
- Metrics, percentages, revenue figures, or latency reductions (e.g. transforming *"Improved API performance"* into *"Improved API performance by 40%"* without user-supplied metrics is flagged as `UNSUPPORTED`).

### 4.2 Evidence Guard Classification (`EvidenceGuardService`)

Located in `apps/api/src/modules/resume/tailoring/evidence-guard.service.ts`:

| Classification | Meaning | UI Presentation |
| :--- | :--- | :--- |
| **`VERIFIED`** | Explicitly supported by Career Twin projects, skills, or resume bullets. | Green badge with verified shield icon. |
| **`NEEDS_REVIEW`** | Stylistic rephrasing or general claim requiring user confirmation. | Amber badge with review alert icon. |
| **`UNSUPPORTED`** | Contains ungrounded metrics or unverified technologies. | Red badge with neutral, non-accusatory guidance. |

**Neutral Guidance Phrasing**:
> *"This suggestion could not be verified from your Career Twin or resume evidence. Add supporting experience if it is accurate."*

---

## 5. Resume Tailoring Workflow & Versioning

### 5.1 Tailoring Lifecycle
1. **Initiate Session**: `POST /api/v1/resumes/:resumeId/tailor/:jobId`
   - Checks ownership of Resume and Job.
   - Extracts Job DNA and Candidate Career Twin.
   - Generates suggestions via `AIProvider`.
   - Runs suggestions through `EvidenceGuardService`.
   - Persists session (`ResumeTailoringSession`) and suggestions (`ResumeTailoringSuggestion`).
2. **Review & Interactive Approval**:
   - User reviews each suggestion in the Tailoring Studio.
   - Accept: `POST /api/v1/tailoring/:sessionId/suggestions/:id/accept`
   - Reject: `POST /api/v1/tailoring/:sessionId/suggestions/:id/reject`
3. **Complete Tailoring**: `POST /api/v1/tailoring/:sessionId/complete`
   - Reads all `ACCEPTED` suggestions.
   - Generates a **new** `ResumeVersion` (`versionNumber: N + 1`).
   - Re-analyzes and scores the new version immediately.
   - Original baseline version remains untouched.

### 5.2 Database Models Added (`apps/api/prisma/schema.prisma`)
- `ResumeTailoringSession`: Tracks `userId`, `resumeVersionId`, `jobId`, `status` (`GENERATED`, `REVIEWING`, `APPROVED`, `COMPLETED`, `CANCELLED`).
- `ResumeTailoringSuggestion`: Tracks `type`, `originalText`, `proposedText`, `reason`, `evidenceReferences`, `guardStatus`, `status` (`PENDING`, `ACCEPTED`, `REJECTED`).
- `AIUsage`: Tracks `userId`, `provider`, `operation`, `model`, `requestCount`, and timestamp for cost control and quota monitoring.

---

## 6. Adzuna Job Discovery & Import

### 6.1 Provider Hierarchy (`apps/api/src/modules/job/providers/`)
- `JobProvider`: Common interface defining job ingestion.
- `ManualJobProvider`: Manual JD input (Phase 4).
- `AdzunaProvider`: Real-time market job search and normalization (Phase 5).

### 6.2 Response Normalization
Adzuna API responses are stripped of raw parameters and normalized into `JobSearchResult`:
```ts
export interface JobSearchResult {
  id: string; // e.g. "adzuna-123456"
  title: string; // Cleaned text (HTML tags stripped)
  company: string;
  location: string;
  description: string;
  salary: string; // Formatted with currency symbol
  source: 'ADZUNA';
  sourceUrl: string; // Direct listing URL
  postedAt: string;
}
```

### 6.3 One-Click Import
- Endpoint: `POST /api/v1/job-search/import`
- Creates a `Job` record in Resumind with `source: 'ADZUNA'`.
- Automatically triggers Job DNA analysis for instant resume matching.
- Detects duplicate imports to prevent cluttering the user's dashboard.

---

## 7. Cost Controls & Rate Limiting

1. **Session Caching**: `generateTailoringSession` reuses existing active sessions for identical `(userId, resumeVersionId, jobId)` tuples unless `forceRefresh: true` is passed.
2. **AI Rate Limiting**: Max 30 tailoring generation calls per 15-minute window per IP.
3. **Search Rate Limiting**: Max 60 Adzuna search requests per 15-minute window per IP.
4. **Token & Call Tracking**: Every AI operation logs an entry in `ai_usage`.

---

## 8. API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/resumes/:resumeId/tailor/:jobId` | Generate or resume AI tailoring session | Yes |
| `GET` | `/api/v1/tailoring/:sessionId` | Get tailoring session and suggestions | Yes |
| `POST` | `/api/v1/tailoring/:sessionId/suggestions/:id/accept` | Accept a tailoring suggestion | Yes |
| `POST` | `/api/v1/tailoring/:sessionId/suggestions/:id/reject` | Reject a tailoring suggestion | Yes |
| `POST` | `/api/v1/tailoring/:sessionId/complete` | Apply accepted changes and create new resume version | Yes |
| `GET` | `/api/v1/job-search` | Search real-time jobs via Adzuna | Yes |
| `POST` | `/api/v1/job-search/import` | Import Adzuna job into Resumind | Yes |
| `GET` | `/api/v1/job-search/salary-estimate` | Retrieve salary estimate for role/location | Yes |

---

## 9. Verification & Quality Assurance Results

| Check | Tool | Result |
| :--- | :--- | :--- |
| **Backend TypeScript Check** | `npm run typecheck --workspace=@resumind/api` | ✅ 0 errors |
| **Frontend TypeScript Check** | `npm run typecheck --workspace=@resumind/web` | ✅ 0 errors |
| **ESLint** | `npm run lint` | ✅ 0 errors, 0 warnings |
| **Code Formatting** | `npm run format:check` | ✅ 100% formatted |
| **Unit Tests** | `vitest run tests/unit` | ✅ 20/20 passed |
| **Phase 5 Integration Tests** | `vitest run tests/integration/phase5-tailoring-adzuna.test.ts` | ✅ 17/17 passed |
| **Client & SSR Build** | `npm run build --workspace=@resumind/web` | ✅ Built in 37s |
| **API Server Build** | `npm run build --workspace=@resumind/api` | ✅ Built in 3s |
| **Prisma Schema Validation** | `npx prisma validate` | ✅ Valid |

---

## 10. Scope Boundaries

The following features were intentionally excluded per Phase 5 boundaries:
- Application CRM / Kanban job pipeline
- Interview scheduling & Google Calendar sync
- Email notifications & Resend integration
- GitHub portfolio ingestion
- Vector databases / embeddings infrastructure
- Stripe payment workflows
