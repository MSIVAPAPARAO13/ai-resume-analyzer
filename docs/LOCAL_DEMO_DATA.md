# Resumind — Local Demo Data Specification

This document details the deterministic development and demo dataset seeded into the local PostgreSQL database to power the Google Stitch UI integration and end-to-end verification.

---

## 1. Demo User Account

| Attribute            | Value                                                               |
| :------------------- | :------------------------------------------------------------------ |
| **Full Name**        | Alex Morgan                                                         |
| **Email**            | `alex.morgan.qa@resumind.dev` (also aliased to `demo@resumind.dev`) |
| **Password**         | `Password123!`                                                      |
| **Role**             | `USER`                                                              |
| **Plan**             | `FREE`                                                              |
| **Target Role**      | Full Stack Developer                                                |
| **Experience Level** | Entry Level / Junior                                                |

---

## 2. Connected Career Twin

### Profile

- **Headline**: Full Stack Developer | React, Node.js & Cloud Systems
- **Summary**: Software engineer with experience building full-stack platforms, high-performance REST APIs, and modern React interfaces. Strong foundation in data structures, automated testing, and cloud infrastructure.

### Work Experience

1. **Junior Full Stack Engineer** — _Apex Cloud Innovations_ (2023 - Present, Full-time, San Francisco, CA)
   - Microservices in Node.js and Express
   - Modular React components and responsive styling
   - PostgreSQL query optimization (28% latency reduction)
2. **Software Engineering Intern** — _Horizon Software Labs_ (May 2022 - Aug 2022, Remote)
   - REST API endpoints for analytics dashboards
   - Jest integration tests (90% test coverage)
   - Git feature branch workflows

### Education

- **University of Washington** — B.S. in Computer Science & Engineering (2019 - 2023, GPA: 3.85)

### Skills (11 Classified Skills)

- **Languages**: JavaScript (Advanced), TypeScript (Advanced), Python (Intermediate)
- **Frontend**: React (Advanced)
- **Backend**: Node.js (Advanced), Express (Advanced)
- **Databases**: PostgreSQL (Intermediate), MongoDB (Intermediate)
- **DevOps & Architecture**: Docker (Intermediate), REST APIs (Advanced)
- **Tools**: Git (Advanced)

### Portfolio Projects

1. **TradeFlow**: Full-stack trading platform with WebSocket feeds, market depth indicators, and order execution simulations (TypeScript, React, Node.js, PostgreSQL, Docker).
2. **AI Career Assistant**: AI-powered career assistant providing ATS diagnostic feedback, semantic job matching, and automated resume tailoring (React, Express, Gemini AI, PostgreSQL, Prisma).
3. **ML Prediction System**: Machine-learning prediction pipeline forecasting system resource utilization (Python, FastAPI, Docker, REST APIs).

### Certifications & Achievements

- **Certification**: AWS Certified Cloud Practitioner (`AWS-CCP-849201`)
- **Achievement**: Dean’s Honor List — UW Engineering

---

## 3. Resume & ATS Diagnostics

- **Primary Resume**: `Alex_Morgan_FullStack_Resume.pdf` (READY status)
- **Versions**:
  - `Version 1` (Base Extracted Version)
  - `Version 2` (Tailored for Cloud Full Stack Role)
- **ATS Analysis**:
  - Overall Score: **86 / 100**
  - ATS Readiness Score: **91 / 100**
  - Breakdown: Content 84, Skills 89, Experience 85, Education 90, Formatting 94, Keywords 88
  - Verified Career Twin Alignment: 92% match ratio (11 verified skills)

---

## 4. Target Jobs & Match Matrix

1. **Full Stack Developer** — _StripeWave Financial_ (San Francisco, CA, Hybrid)
   - _Required Skills_: JavaScript, React, Node.js, REST APIs, Git
   - _Preferred Skills_: TypeScript, Docker, PostgreSQL
   - _Match Score_: **88%** (Strong: 7, Partial: 1 [Docker], Missing: 2 [AWS, Testing])
2. **Frontend Developer** — _Veloce Design Systems_ (Remote)
   - _Required Skills_: React, JavaScript, HTML, CSS
   - _Preferred Skills_: TypeScript, Testing, Accessibility
3. **Software Engineer** — _ScaleMetric Cloud_ (Seattle, WA, On-site)
   - _Required Skills_: JavaScript, Node.js, SQL, Git
   - _Preferred Skills_: Docker, AWS, Testing

---

## 5. AI Resume Tailoring & Evidence Guard Session

- **Session**: Tailoring for _Full Stack Developer_ at _StripeWave Financial_
- **Suggestions**:
  1. _Rewrite_: High-throughput Node.js microservices with Docker deployment → **VERIFIED** (Status: `ACCEPTED`)
  2. _Keyword Alignment_: Merchant portal UI in React + TypeScript → **NEEDS_REVIEW** (Status: `PENDING`)
  3. _Add Evidence_: Multi-region AWS Aurora database migration → **UNSUPPORTED** (Status: `REJECTED` — prevented by Evidence Guard)

---

## 6. Application Pipeline CRM

| Company                   | Role                     | Status       | Applied Date | Notes / Next Step                                       |
| :------------------------ | :----------------------- | :----------- | :----------- | :------------------------------------------------------ |
| **StripeWave Financial**  | Full Stack Developer     | `INTERVIEW`  | 14 days ago  | Technical take-home passed (98%), final panel scheduled |
| **Veloce Design Systems** | Frontend Developer       | `APPLIED`    | 5 days ago   | Waiting on recruiter screening response                 |
| **QuantumFlow Robotics**  | Junior Software Engineer | `ASSESSMENT` | 9 days ago   | HackerRank challenge pending                            |
| **Fintech Nexus Labs**    | Full Stack Associate     | `OFFER`      | 30 days ago  | Formal offer extended: $118k base + equity              |
| **Legacy Data Corp**      | Software Developer       | `REJECTED`   | 25 days ago  | Requisition closed internally                           |
| **ScaleMetric Cloud**     | Software Engineer        | `SAVED`      | Current      | Saved target job                                        |

---

## 7. Interview Intelligence & Simulation

- **Session**: _Full Stack Technical Simulation — StripeWave_
- **Mode**: `MOCK_INTERVIEW` (Completed)
- **Overall Score**: **87.5 / 100**
- **Questions & STAR Evaluations**:
  1. _Technical_: Event loop unblocking & streaming in Node.js (Score: 90 / 100)
  2. _Behavioral_: Production database bottleneck diagnostic & resolution (Score: 88 / 100, latency reduced from 450ms → 32ms)

---

## 8. Learning Plan & Skill Gaps

- **Active Plan**: _Docker Mastery_ (Target Role: Full Stack Developer)
- **Goal**: Docker (Priority: `HIGH`, Status: `IN_PROGRESS`)
- **Tasks**:
  1. Docker fundamentals — `COMPLETED`
  2. Build Docker image — `COMPLETED`
  3. Docker Compose — `IN_PROGRESS`
  4. Containerize Node API — `IN_PROGRESS`
  5. Deploy container — `TODO`
- **Active Skill Gaps Identified**: AWS, Testing, Accessibility, Docker

---

## 9. Career Analytics Snapshot

- **Readiness Score**: **84.5%**
- **Skills Score**: 88.0%
- **Resume Score**: 86.0%
- **Evidence Score**: 82.0%
- **Interview Score**: 87.5%
- **Trend**: +6.5% over the past 30 days
- **Active Applications Count**: 4
- **Completed Interviews**: 1
- **Learning Progress**: 40.0%

---

## 10. Neon Database Branching & Environment Isolation

| Target Database | Neon Branch | Seed Policy | Verification Script |
| :--- | :--- | :--- | :--- |
| **Neon Development** | `development` (`br-royal-glitter-b5jsldv1`) | **SEEDED** with Alex Morgan test persona | `node scripts/seed-neon-development.js` |
| **Neon Production** | `production` (`br-solitary-recipe-b5ypcupm`) | **CLEAN** (0 synthetic records) | `node scripts/test-neon-db.js` |
| **Local Docker** | `localhost:5432/resumind_dev` | Optional local development seed | `npm run db:seed` |

> **Critical Isolation Rule**: The Neon `production` branch must NEVER be seeded with synthetic demo users. All development, staging, and QA seeding operations run strictly against the Neon `development` branch or local developer environments.
