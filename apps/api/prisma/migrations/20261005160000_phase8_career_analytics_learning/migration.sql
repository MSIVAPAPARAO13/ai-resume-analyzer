-- CreateEnum
CREATE TYPE "LearningPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SkillPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "GoalTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateTable
CREATE TABLE "learning_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "targetRole" TEXT,
    "status" "LearningPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "planId" UUID NOT NULL,
    "skillName" TEXT NOT NULL,
    "priority" "SkillPriority" NOT NULL DEFAULT 'MEDIUM',
    "currentLevel" TEXT DEFAULT 'UNKNOWN',
    "targetLevel" TEXT DEFAULT 'STRONG',
    "status" "GoalTaskStatus" NOT NULL DEFAULT 'TODO',
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "goalId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT DEFAULT 'PRACTICE',
    "status" "GoalTaskStatus" NOT NULL DEFAULT 'TODO',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "evidenceReference" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "readinessScore" DOUBLE PRECISION NOT NULL,
    "skillScore" DOUBLE PRECISION,
    "resumeScore" DOUBLE PRECISION,
    "evidenceScore" DOUBLE PRECISION,
    "interviewScore" DOUBLE PRECISION,
    "completenessScore" DOUBLE PRECISION,
    "skillsCount" INTEGER DEFAULT 0,
    "verifiedSkillsCount" INTEGER DEFAULT 0,
    "gapsCount" INTEGER DEFAULT 0,
    "activeApplications" INTEGER DEFAULT 0,
    "completedInterviews" INTEGER DEFAULT 0,
    "learningProgress" DOUBLE PRECISION DEFAULT 0,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_plans_userId_idx" ON "learning_plans"("userId");
CREATE INDEX "learning_plans_userId_status_idx" ON "learning_plans"("userId", "status");

-- CreateIndex
CREATE INDEX "learning_goals_planId_idx" ON "learning_goals"("planId");
CREATE INDEX "learning_goals_skillName_idx" ON "learning_goals"("skillName");

-- CreateIndex
CREATE INDEX "learning_tasks_goalId_idx" ON "learning_tasks"("goalId");

-- CreateIndex
CREATE INDEX "career_snapshots_userId_idx" ON "career_snapshots"("userId");
CREATE INDEX "career_snapshots_userId_createdAt_idx" ON "career_snapshots"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "learning_plans" ADD CONSTRAINT "learning_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_goals" ADD CONSTRAINT "learning_goals_planId_fkey" FOREIGN KEY ("planId") REFERENCES "learning_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_tasks" ADD CONSTRAINT "learning_tasks_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "learning_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_snapshots" ADD CONSTRAINT "career_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
