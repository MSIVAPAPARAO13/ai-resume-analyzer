# Resumind — Phase 3 Verification & Walkthrough: Resume Intelligence

**Status:** Completed  
**Branch:** `feature/phase-3-resume-intelligence`  
**Date:** 2026-10-02

---

## 1. Executive Summary

Phase 3 introduces **Resume Intelligence**, the first core processing and evaluation engine of Resumind. It provides an end-to-end pipeline allowing candidates to upload resumes (PDF & DOCX), extract document text, deterministically parse structured sections, compute explainable multi-category resume scores, identify strengths and actionable improvements, and perform neutral comparison against the user's verified **Career Twin** ground truth.

All implementations strictly adhere to the defined Phase 3 boundaries:

- **No external AI API keys required**: Designed with provider abstraction (`AIProvider` -> `MockAIProvider`).
- **No Phase 4+ scope creep**: Excluded Job Description matching, Evidence Guard, automated AI tailoring, CRM, interview modules, and embeddings.
- **Tenant isolation**: Every endpoint and database query strictly enforces authenticated-user ownership.

---

## 2. Architecture & File Structure

```
apps/api/
├── prisma/
│   ├── schema.prisma                     # Resume, ResumeVersion, ResumeAnalysis models & ResumeStatus enum
│   └── migrations/
│       └── 20261001180312_phase3_resume_intelligence/
├── src/
│   ├── modules/
│   │   └── resume/
│   │       ├── ai/
│   │       │   ├── ai.interface.ts        # AIProvider contract for structured analysis
│   │       │   └── mock-ai.provider.ts    # Deterministic mock provider without external API keys
│   │       ├── parser/
│   │       │   ├── document-parser.interface.ts # DocumentParser contract
│   │       │   ├── pdf.parser.ts          # PDF text extractor via pdf-parse v2
│   │       │   ├── docx.parser.ts         # DOCX text extractor via mammoth
│   │       │   ├── section.parser.ts      # Deterministic section & metadata parser
│   │       │   └── resume-parser.service.ts # Unified parsing orchestrator
│   │       ├── scoring/
│   │       │   ├── scoring.engine.ts      # Explainable 0-100 scoring & rule engine
│   │       │   └── comparison.engine.ts   # Career Twin alignment comparison engine
│   │       ├── storage/
│   │       │   ├── storage.interface.ts   # StorageProvider abstraction
│   │       │   └── local-storage.provider.ts # Local disk implementation with path traversal safeguards
│   │       ├── resume.controller.ts       # HTTP request handlers & error mapping
│   │       ├── resume.router.ts           # Route definitions with multer & auth middleware
│   │       ├── resume.service.ts          # Orchestration service for persistence & pipeline
│   │       └── resume.validation.ts       # Zod schemas for parsed sections & inputs
│   └── app.ts                             # Mounts /api/v1/resumes
└── tests/
    └── integration/
        └── resume-intelligence.test.ts    # 14 integration tests verifying upload, parsing, scoring, ownership

apps/web/
├── app/
│   ├── routes/
│   │   ├── resumes.tsx                    # Resume listing, status badges, upload component
│   │   ├── resume-detail.tsx              # Multi-tab section inspector (Experience, Skills, Education, etc.)
│   │   ├── resume-analysis.tsx            # Visual scorecard, category bars, strengths, improvements, Twin comparison
│   │   └── dashboard.tsx                  # Dashboard with active Resume Intelligence card & navigation
│   ├── lib/
│   │   └── api.ts                         # resumeApi client methods
│   └── routes.ts                          # Route registrations for /resumes, /resumes/:id, /resumes/:id/analysis
└── tests/
    └── unit/
        └── resume.test.ts                 # Unit tests for scoring & format helpers

tests/
├── e2e/
│   └── resume-intelligence.spec.ts        # Playwright end-to-end critical journey test
└── fixtures/
    └── sample_resume.pdf                  # Valid test PDF fixture for E2E runs
```

---

## 3. Database Design & Models

The Prisma schema (`apps/api/prisma/schema.prisma`) was extended with 3 models and 1 enum:

### `ResumeStatus` (Enum)

- `UPLOADED`: File stored, awaiting text extraction.
- `PROCESSING`: Text extraction and section parsing underway.
- `READY`: Extraction, parsing, and structured data ready for inspection and scoring.
- `FAILED`: Parsing or extraction encountered a critical error.

### `Resume` (Model)

- `id` (`String` UUID, Primary Key)
- `userId` (`String` UUID, Foreign Key -> `User.id` with `onDelete: Cascade`)
- `title` (`String`, user-defined or derived from original filename)
- `originalFileName` (`String`, sanitized)
- `fileType` (`String`, e.g. `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
- `fileSize` (`Int`, file size in bytes, max 10MB)
- `storageKey` (`String`, unique generated UUID filename, preventing collisions and path traversal)
- `status` (`ResumeStatus`, default: `UPLOADED`)
- `createdAt` / `updatedAt` (`DateTime`)
- Relations: `versions` (`ResumeVersion[]`), `user` (`User`)

### `ResumeVersion` (Model)

- `id` (`String` UUID, Primary Key)
- `resumeId` (`String` UUID, Foreign Key -> `Resume.id` with `onDelete: Cascade`)
- `versionNumber` (`Int`, incremental versioning)
- `extractedText` (`String` `@db.Text`, raw text content)
- `parsedData` (`Json`, structured JSON conforming to `ParsedResumeDataSchema`)
- `createdAt` (`DateTime`)
- Relations: `analyses` (`ResumeAnalysis[]`), `resume` (`Resume`)

### `ResumeAnalysis` (Model)

- `id` (`String` UUID, Primary Key)
- `resumeVersionId` (`String` UUID, Foreign Key -> `ResumeVersion.id` with `onDelete: Cascade`)
- `overallScore` (`Int`, explainable weighted score 0-100)
- `atsScore` (`Int`, structure & ATS readability score)
- `contentScore` (`Int`, content depth & action verb score)
- `skillsScore` (`Int`, technical skill density & categorization score)
- `experienceScore` (`Int`, work history completeness & metric impact score)
- `educationScore` (`Int`, degree and institution score)
- `formattingScore` (`Int`, text density & readability score)
- `summaryScore` (`Int`, presence and length of professional summary)
- `keywordScore` (`Int`, keyword density and domain relevance)
- `result` (`Json`, complete structured payload including category scores, strengths, improvements, Career Twin comparison)
- `createdAt` (`DateTime`)

---

## 4. Storage Provider Abstraction

- **Interface:** `StorageProvider` defines `upload(file: Express.Multer.File): Promise<UploadedFileResult>`, `read(key: string): Promise<Buffer>`, `delete(key: string): Promise<void>`.
- **Implementation:** `LocalStorageProvider` writes to disk (`uploads/resumes/`).
- **Security Safeguards:**
  - Files are renamed to `<uuid>.<ext>`, never using client-provided filenames directly.
  - Safe sanitization via `path.basename()` prevents directory traversal attacks (`../`).
  - Stored files are kept outside the public web root.
  - Raw filesystem paths are never exposed to the client.

---

## 5. Document Extraction & Section Parsing

### Extraction Providers

- **`PdfParser`**: Uses `pdf-parse` v2 (`PDFParse`) with clean ESM/CJS compatibility to extract UTF-8 text streams from binary PDF buffers.
- **`DocxParser`**: Uses `mammoth` (`extractRawText`) to extract clean text streams from Word documents.
- **Error Handling**: Corrupt or empty documents throw explicit `ValidationError` or `DocumentParsingError` envelopes.

### Deterministic Section Parser (`SectionParser`)

Parses plain text into validated Zod structures (`ParsedResumeDataSchema`):

- **Contact:** Regex matching for emails (`[\w.-]+@[\w.-]+\.\w+`), phone numbers (international/domestic formats), and links (GitHub, LinkedIn, personal portfolios).
- **Summary:** Identifies summary / objective / professional overview headers.
- **Experience:** Detects job roles, companies, date ranges, and bulleted achievements.
- **Skills:** Matches against categorized technical skills (Languages, Frameworks, Databases, Cloud & DevOps, Tools).
- **Education:** Extracts institutions, degrees, graduation years, and fields of study.
- **Projects:** Extracts project names, technologies, descriptions, and URLs.
- **Certifications & Achievements:** Captures credentials and milestone accomplishments.
- **Fact Integrity:** Never fabricates data; if a section is absent, it is assigned `null` or `[]`.

---

## 6. Scoring Methodology & Explainability

Resumes are scored across measurable, documented criteria on a 0-100 scale:

$$\text{Overall Score} = \sum (\text{Category Score} \times \text{Weight})$$

| Category             | Weight | Evaluation Criteria                                                                                                             |
| :------------------- | :----: | :------------------------------------------------------------------------------------------------------------------------------ |
| **ATS Readiness**    |  20%   | Standard section headers detected, machine-readable text density, contact information completeness.                             |
| **Content Quality**  |  25%   | Action verbs (architected, led, implemented), quantifiable metrics (% reduction, user counts, latency), bullet point structure. |
| **Skills Coverage**  |  20%   | Number of detected technical skills, categorizations, and alignment with target engineering roles.                              |
| **Experience Depth** |  20%   | Job titles, company names, employment durations, and impact descriptions.                                                       |
| **Education**        |  10%   | Degree level (BS, MS, PhD) and accredited institution name.                                                                     |
| **Formatting**       |   5%   | Line length distribution, whitespace balance, avoiding excessive unreadable characters.                                         |

### Strength & Improvement Generator

The engine analyzes the score breakdown to produce human-readable, actionable feedback:

- **Strengths:** Highlights quantifiable achievements, comprehensive contact links, and deep technical skill sets.
- **Improvements:** Recommends adding metrics to experience bullets, including a professional summary, or detailing project technologies.

---

## 7. Career Twin Comparison Engine

The comparison engine compares extracted resume entities against the user's authenticated **Career Twin** profile:

1. **`presentInBoth`**: Skills, experiences, or degrees found both on the uploaded resume and in the Career Twin profile.
2. **`inTwinOnly`**: Verified career items present in the user's Career Twin that are omitted from this specific resume (opportunities to strengthen the resume).
3. **`inResumeOnly`**: Items found on the resume that have not yet been logged in the user's Career Twin (prompting the user: _"Not found in your Career Twin — add to your profile to verify"_).
4. **Non-Accusatory Language:** Following system guidelines, this is **not** an Evidence Guard. Discrepancies are flagged neutrally without accusatory labels.

---

## 8. REST API Reference

| Method   | Endpoint                                  | Description                                                                     | Auth Required |
| :------- | :---------------------------------------- | :------------------------------------------------------------------------------ | :-----------: |
| `POST`   | `/api/v1/resumes`                         | Uploads resume (`multipart/form-data`), extracts text, and parses sections      |      Yes      |
| `GET`    | `/api/v1/resumes`                         | Lists all resumes owned by the authenticated user                               |      Yes      |
| `GET`    | `/api/v1/resumes/:id`                     | Retrieves resume metadata, latest version, parsed sections, and latest analysis |      Yes      |
| `DELETE` | `/api/v1/resumes/:id`                     | Deletes resume, versions, analysis records, and physical disk storage           |      Yes      |
| `POST`   | `/api/v1/resumes/:id/analyze`             | Triggers scoring engine and Career Twin alignment analysis                      |      Yes      |
| `GET`    | `/api/v1/resumes/:id/analysis`            | Retrieves existing analysis and scorecard                                       |      Yes      |
| `GET`    | `/api/v1/resumes/:id/versions`            | Lists all versions of a given resume                                            |      Yes      |
| `GET`    | `/api/v1/resumes/:id/versions/:versionId` | Retrieves specific version with extracted text and structured JSON              |      Yes      |

---

## 9. Security & User Isolation

- **Authentication:** All routes enforce the `authenticate` middleware with valid JWT access tokens.
- **Tenant Isolation:** Every Prisma query includes `where: { id, userId }`. User A cannot read, analyze, or delete User B's resumes (verified with 404/403 test cases).
- **MIME & Extension Validation:** Only `application/pdf` and `application/vnd.openxmlformats-officedocument.wordprocessingml.document` are accepted. Executables or arbitrary files are rejected with `400 VALIDATION_ERROR`.
- **File Size Enforced:** Maximum file size capped at 10MB via Multer limits.
- **Safe Filename Generation:** Files are saved using UUID keys (`crypto.randomUUID()`), completely eliminating path traversal vulnerabilities.

---

## 10. Automated Test Results

### Unit & Integration Tests (`npm test`)

- Total test files: **5 passed (100%)**
- Total automated tests: **56 passed (100%)**
  - `@resumind/api`: **50 passed**
    - `health.test.ts` (19 tests)
    - `auth-career.test.ts` (17 tests)
    - `resume-intelligence.test.ts` (14 tests)
  - `@resumind/web`: **6 passed**
    - `smoke.test.ts` (3 tests)
    - `resume.test.ts` (3 tests)

### Build & Quality Verification

- `npm run typecheck`: **0 errors** across all workspaces.
- `npm run lint`: **0 errors, 0 warnings** across all workspaces.
- `npm run format:check`: **All files match Prettier code style**.
- `npm run build`: Production client and SSR bundle compiled cleanly.

---

## 11. Known Limitations & Next Steps (Phase 4)

- **AI Enhancements:** Currently utilizes deterministic rule-based analysis and `MockAIProvider`. Phase 4+ will introduce Gemini API integration with zero-shot parsing fallback.
- **OCR Support:** Scanned image-only PDFs without a text layer currently produce an empty text warning; future phases can add Tesseract/Google Vision OCR.
- **Job Description Matching:** Phase 3 purposefully excludes JD parsing and keyword matching, which are scheduled for Phase 4.
