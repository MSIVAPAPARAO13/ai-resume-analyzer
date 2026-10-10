# Resumind — Neon Cloud PostgreSQL Setup & Architecture Report

**Document Version**: 1.0.0  
**Generated**: October 2026  
**Status**: COMPLETE & VERIFIED  
**Neon Project**: `orange-resonance-81564919` (`resumind`)  
**Region**: `aws-us-east-2` (US East, Ohio)  
**Database Engine**: PostgreSQL 18.6 (Serverless)  
**Architecture Policy**: Zero-Card-Required, Strict Tenant Isolation, Dual-Branch Strategy  

---

## 1. Executive Summary

Resumind's database architecture has been transitioned to Neon Serverless PostgreSQL with zero upfront financial or credit/debit card requirement. The setup establishes:
1. **Isolated Multi-Branch Topology**: An immutable, clean `production` branch paired with an ephemeral, reproducible `development` branch.
2. **Schema Uniformity**: 7 Prisma migration phases completely deployed to Neon, constructing all **33 core relational tables**.
3. **Evidence Guard & Tenant Isolation**: Verification confirming zero synthetic test records on `production` (preserving strict truth-grounding and production data hygiene) while deterministic demo records exist solely on `development`.
4. **Neon Developer Platform Integration**: Global CLI v8.3.5 integration, Neon Agent Skills (`.agents/skills/`), project-scoped Neon Model Context Protocol (MCP) server, and declarative branch lifecycle policy (`neon.ts`).
5. **Zero-Secret Security Standard**: Strict sanitization preventing credentials, access tokens, or connection strings from leaking into version control, reports, or CI artifacts.

---

## 2. Infrastructure & Branch Topology

| Parameter | Production Branch | Development Branch |
| :--- | :--- | :--- |
| **Branch Name** | `production` | `development` |
| **Branch ID** | `br-solitary-recipe-b5ypcupm` | `br-royal-glitter-b5jsldv1` |
| **Parent Branch** | `[root]` | `production` |
| **Default Branch** | Yes | No |
| **Current State** | `ready` | `ready` |
| **Schema State** | Migrated (33 Tables) | Migrated (33 Tables) |
| **Data State** | Clean (0 Seed Records) | Seeded (Alex Morgan QA Demo) |
| **TTL Policy** | Permanent | Auto-expiring / On-demand |
| **Connection Pooling** | PgBouncer enabled (`-pooler`) | PgBouncer enabled (`-pooler`) |

### Branch Lifecycle Policy (`neon.ts`)

```typescript
import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: false,
  branch: (branch) => {
    if (branch.isDefault) {
      // Production default branch has permanent retention
      return {};
    }
    if (!branch.exists) {
      // Ephemeral preview branches auto-expire after 7 days
      return { ttl: "7d" };
    }
    return {};
  },
});
```

---

## 3. Database Schema & Migration Inventory

All Prisma migrations were deployed using Neon CLI connection resolution (`scripts/deploy-neon-migrations.js`).

### Applied Migrations
1. `20250221000000_phase2_core_schema` — Users, refresh tokens, career profiles, work experience, education, skills, projects, certifications, achievements.
2. `20250222000000_phase3_resume_analysis` — Resumes, resume versions, resume sections, ATS diagnostic resume analyses.
3. `20250223000000_phase4_job_matching` — Ingested jobs, parsed job requirements, semantic job match scorecards.
4. `20250224000000_phase5_resume_tailoring` — Tailoring sessions, section-by-section diff proposals, Evidence Guard verification tags.
5. `20250225000000_phase6_application_tracker` — CRM pipeline applications, event audit logs, notes, interview scheduler links.
6. `20250226000000_phase7_mock_interview` — AI mock interview sessions, questions, speech/text rubrics, evidence-grounded performance feedbacks.
7. `20250227000000_phase8_career_analytics` — Skill gap matrix, learning roadmaps, goal tasks, benchmark radar snapshots, daily metrics.

### Public Schema Table Audit (33 Tables)

```
_prisma_migrations                 learning_goals
achievement                        learning_plans
application_events                 projects
application_notes                  resume_analyses
applications                       resume_sections
career_profiles                    resume_tailoring_sessions
career_readiness_snapshots         resume_versions
certifications                     resumes
daily_metrics                      skills
educations                         tailoring_suggestions
experiences                        target_role_benchmarks
goal_tasks                         user_refresh_tokens
interview_feedbacks                user_settings
interview_questions                users
interview_sessions                 weekly_analytics_summaries
job_matches
job_requirements
jobs
```

---

## 4. Evidence Guard & Tenant Separation Audit

Dual-branch inspection executed via `scripts/test-neon-db.js` against live Neon PostgreSQL endpoints:

```
========================================
🔍 Inspecting Neon Branch: [production]
========================================
Database engine: PostgreSQL 18 on Neon serverless
Public tables count: 33
Row counts for [production]:
  - users: 0
  - resumes: 0
  - jobs: 0
  - applications: 0
🛡️ EVIDENCE GUARD & PROD ISOLATION VERIFIED: Production branch is clean (0 demo records).

========================================
🔍 Inspecting Neon Branch: [development]
========================================
Database engine: PostgreSQL 18 on Neon serverless
Public tables count: 33
Row counts for [development]:
  - users: 2
  - resumes: 2
  - jobs: 6
  - applications: 12
✅ DEV SEED VERIFIED: Development branch has 2 active test users.
```

### Truth Grounding & Evidence Guard Rules
- **No Hallucinated Claims**: All resume tailoring suggestions must carry status `VERIFIED`, `NEEDS_REVIEW`, or `UNSUPPORTED` mapping directly to items in the user's `career_profiles`.
- **Zero Synthetic Cross-Contamination**: Test accounts (`alex.morgan.qa@resumind.dev`, `demo@resumind.dev`) are isolated strictly to the Neon `development` branch or local developer environments.

---

## 5. Developer & Agent Integration

1. **Neon CLI Tooling**:
   - CLI version: `8.3.5`
   - Linked project context: `orange-resonance-81564919` (`resumind`)
   - Linked profile: `DEFAULT` configured securely with Neon API credentials.
2. **Neon Agent Skills**:
   - Installed in `.agents/skills/` (Neon branching, schema syncing, connection pooling, and snapshotting).
3. **Model Context Protocol (MCP)**:
   - Configured for Antigravity and VS Code with project-scoped isolation.
4. **Prisma Client Generation**:
   - Client generated with custom binary targets for local Windows development and Linux/containerized serverless deployments.

---

## 6. Verification & Run Commands

| Objective | Command |
| :--- | :--- |
| **Check Neon Status** | `npx neon status` |
| **List Branches** | `npx neon branches list` |
| **Validate Branch Policy** | `npx neon config plan` |
| **Deploy Migrations to Prod** | `node scripts/deploy-neon-migrations.js` |
| **Seed Development Branch** | `node scripts/seed-neon-development.js` |
| **Run Dual-Branch Audit** | `node scripts/test-neon-db.js` |

---

*Report certified by Resumind Lead Architecture & DevOps — Antigravity Engineering.*
