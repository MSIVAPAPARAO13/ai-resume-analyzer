-- CreateEnum
CREATE TYPE "ResumeTailoringStatus" AS ENUM ('GENERATED', 'REVIEWING', 'APPROVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TailoringSuggestionType" AS ENUM ('REWRITE', 'REORDER', 'ADD_EVIDENCE', 'REMOVE_REDUNDANCY', 'KEYWORD_ALIGNMENT', 'SUMMARY_UPDATE', 'PROJECT_EMPHASIS');

-- CreateEnum
CREATE TYPE "EvidenceGuardStatus" AS ENUM ('VERIFIED', 'NEEDS_REVIEW', 'UNSUPPORTED');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "model" TEXT,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "estimatedTokens" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_tailoring_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "resumeVersionId" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "status" "ResumeTailoringStatus" NOT NULL DEFAULT 'GENERATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_tailoring_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_tailoring_suggestions" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "type" "TailoringSuggestionType" NOT NULL,
    "originalText" TEXT NOT NULL,
    "proposedText" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceReferences" TEXT[],
    "guardStatus" "EvidenceGuardStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "confidence" DOUBLE PRECISION DEFAULT 1.0,
    "requiresUserApproval" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_tailoring_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_userId_idx" ON "ai_usage"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_userId_createdAt_idx" ON "ai_usage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "resume_tailoring_sessions_userId_idx" ON "resume_tailoring_sessions"("userId");

-- CreateIndex
CREATE INDEX "resume_tailoring_sessions_resumeVersionId_idx" ON "resume_tailoring_sessions"("resumeVersionId");

-- CreateIndex
CREATE INDEX "resume_tailoring_sessions_jobId_idx" ON "resume_tailoring_sessions"("jobId");

-- CreateIndex
CREATE INDEX "resume_tailoring_sessions_userId_jobId_idx" ON "resume_tailoring_sessions"("userId", "jobId");

-- CreateIndex
CREATE INDEX "resume_tailoring_suggestions_sessionId_idx" ON "resume_tailoring_suggestions"("sessionId");

-- CreateIndex
CREATE INDEX "resume_tailoring_suggestions_sessionId_status_idx" ON "resume_tailoring_suggestions"("sessionId", "status");

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_tailoring_sessions" ADD CONSTRAINT "resume_tailoring_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_tailoring_sessions" ADD CONSTRAINT "resume_tailoring_sessions_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "resume_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_tailoring_sessions" ADD CONSTRAINT "resume_tailoring_sessions_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_tailoring_suggestions" ADD CONSTRAINT "resume_tailoring_suggestions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "resume_tailoring_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
