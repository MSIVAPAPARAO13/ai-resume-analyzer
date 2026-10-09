-- CreateEnum
CREATE TYPE "InterviewMode" AS ENUM ('PREPARATION', 'MOCK_INTERVIEW');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "InterviewDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "InterviewQuestionCategory" AS ENUM ('RESUME', 'CAREER_TWIN', 'PROJECT', 'TECHNICAL', 'JOB_SPECIFIC', 'BEHAVIORAL', 'SITUATIONAL', 'COMPANY_ROLE', 'EXPERIENCE');

-- CreateTable
CREATE TABLE "interview_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "applicationId" UUID,
    "jobId" UUID,
    "resumeVersionId" UUID,
    "tailoringSessionId" UUID,
    "title" TEXT NOT NULL,
    "mode" "InterviewMode" NOT NULL DEFAULT 'PREPARATION',
    "status" "InterviewStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "difficulty" "InterviewDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "overallScore" DOUBLE PRECISION,
    "finalReport" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_questions" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "category" "InterviewQuestionCategory" NOT NULL,
    "difficulty" "InterviewDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "question" TEXT NOT NULL,
    "whyAsked" TEXT NOT NULL,
    "expectedSignals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceReferences" JSONB,
    "preparationTips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_answers" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "answerText" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" DOUBLE PRECISION,
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weaknesses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "missingPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "improvementSuggestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceAlignment" TEXT,
    "recommendedStructure" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_connections" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "googleEmail" TEXT,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_reminders" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT '24H',
    "emailNotification" BOOLEAN NOT NULL DEFAULT true,
    "calendarEventId" TEXT,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interview_sessions_userId_idx" ON "interview_sessions"("userId");
CREATE INDEX "interview_sessions_userId_status_idx" ON "interview_sessions"("userId", "status");
CREATE INDEX "interview_sessions_applicationId_idx" ON "interview_sessions"("applicationId");
CREATE INDEX "interview_sessions_jobId_idx" ON "interview_sessions"("jobId");

-- CreateIndex
CREATE INDEX "interview_questions_sessionId_idx" ON "interview_questions"("sessionId");
CREATE INDEX "interview_questions_sessionId_orderIndex_idx" ON "interview_questions"("sessionId", "orderIndex");

-- CreateIndex
CREATE INDEX "interview_answers_questionId_idx" ON "interview_answers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_connections_userId_key" ON "calendar_connections"("userId");
CREATE INDEX "calendar_connections_userId_idx" ON "calendar_connections"("userId");

-- CreateIndex
CREATE INDEX "interview_reminders_userId_idx" ON "interview_reminders"("userId");
CREATE INDEX "interview_reminders_sessionId_idx" ON "interview_reminders"("sessionId");
CREATE INDEX "interview_reminders_remindAt_sent_idx" ON "interview_reminders"("remindAt", "sent");

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "resume_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_tailoringSessionId_fkey" FOREIGN KEY ("tailoringSessionId") REFERENCES "resume_tailoring_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_answers" ADD CONSTRAINT "interview_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "interview_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_reminders" ADD CONSTRAINT "interview_reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_reminders" ADD CONSTRAINT "interview_reminders_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
