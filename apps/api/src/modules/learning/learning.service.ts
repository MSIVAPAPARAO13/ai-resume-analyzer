import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error-handler.js';
import { analyticsService } from '../analytics/analytics.service.js';
import { aiProvider } from '../resume/ai/mock-ai.provider.js';

export class LearningService {
  /**
   * Create a new learning plan
   */
  async createPlan(
    userId: string,
    data: {
      title: string;
      targetRole?: string | null;
      targetDate?: string | null;
      status?: any;
    },
  ) {
    if (!data.title || !data.title.trim()) {
      throw new AppError('Plan title is required', 400);
    }

    const plan = await (prisma as any).learningPlan.create({
      data: {
        userId,
        title: data.title.trim(),
        targetRole: data.targetRole || null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        status: data.status || 'ACTIVE',
      },
      include: {
        goals: { include: { tasks: true } },
      },
    });

    return plan;
  }

  /**
   * List all learning plans for user
   */
  async listPlans(userId: string) {
    const plans = await (prisma as any).learningPlan.findMany({
      where: { userId },
      include: {
        goals: {
          include: {
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((plan: any) => {
      const allTasks = plan.goals.flatMap((g: any) => g.tasks);
      const completedTasks = allTasks.filter(
        (t: any) => t.status === 'COMPLETED',
      ).length;
      const progress =
        allTasks.length > 0
          ? Math.round((completedTasks / allTasks.length) * 100)
          : 0;

      return {
        ...plan,
        totalGoals: plan.goals.length,
        totalTasks: allTasks.length,
        completedTasks,
        progress,
      };
    });
  }

  /**
   * Get single plan with tenant isolation
   */
  async getPlan(userId: string, planId: string) {
    const plan = await (prisma as any).learningPlan.findFirst({
      where: { id: planId, userId },
      include: {
        goals: {
          include: {
            tasks: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new AppError('Learning plan not found', 404);
    }

    const allTasks = plan.goals.flatMap((g: any) => g.tasks);
    const completedTasks = allTasks.filter(
      (t: any) => t.status === 'COMPLETED',
    ).length;
    const progress =
      allTasks.length > 0
        ? Math.round((completedTasks / allTasks.length) * 100)
        : 0;

    return {
      ...plan,
      totalGoals: plan.goals.length,
      totalTasks: allTasks.length,
      completedTasks,
      progress,
    };
  }

  /**
   * Update plan metadata
   */
  async updatePlan(
    userId: string,
    planId: string,
    data: {
      title?: string;
      targetRole?: string | null;
      targetDate?: string | null;
      status?: any;
    },
  ) {
    await this.getPlan(userId, planId);

    const updatePayload: any = {};
    if (data.title) updatePayload.title = data.title.trim();
    if (data.targetRole !== undefined)
      updatePayload.targetRole = data.targetRole;
    if (data.targetDate !== undefined) {
      updatePayload.targetDate = data.targetDate
        ? new Date(data.targetDate)
        : null;
    }
    if (data.status) updatePayload.status = data.status;

    return (prisma as any).learningPlan.update({
      where: { id: planId },
      data: updatePayload,
      include: { goals: { include: { tasks: true } } },
    });
  }

  /**
   * Delete plan
   */
  async deletePlan(userId: string, planId: string) {
    await this.getPlan(userId, planId);

    await (prisma as any).learningPlan.delete({
      where: { id: planId },
    });

    return { message: 'Learning plan deleted successfully' };
  }

  /**
   * Generate evidence-building goals and tasks from Skill Gap Analysis
   */
  async generatePlanFromGaps(userId: string, planId: string) {
    const plan = await this.getPlan(userId, planId);
    const gapAnalysis = await analyticsService.getSkillGaps(userId);

    const generated = await aiProvider.generateLearningPlan({
      targetRole: plan.targetRole || 'Software Engineer',
      skillGaps: gapAnalysis.gaps.slice(0, 5).map((g) => ({
        skill: g.skill,
        priority: g.priority,
        currentEvidence: g.currentEvidence,
        requiredEvidence: g.requiredEvidence,
      })),
    });

    // Persist goals and tasks
    for (const goalDef of generated.goals) {
      const createdGoal = await (prisma as any).learningGoal.create({
        data: {
          planId: plan.id,
          skillName: goalDef.skillName,
          priority: goalDef.priority,
          currentLevel: goalDef.currentLevel || 'UNKNOWN',
          targetLevel: goalDef.targetLevel || 'STRONG',
          status: 'TODO',
          rationale: goalDef.rationale,
        },
      });

      for (const taskDef of goalDef.tasks) {
        await (prisma as any).learningTask.create({
          data: {
            goalId: createdGoal.id,
            title: taskDef.title,
            description: taskDef.description,
            type: taskDef.type,
            status: 'TODO',
            evidenceReference: {
              targetEvidence: taskDef.evidenceGoal,
              learningObjective: goalDef.learningObjective,
            },
          },
        });
      }
    }

    return this.getPlan(userId, planId);
  }

  /**
   * Add goal to an existing plan
   */
  async addGoal(
    userId: string,
    planId: string,
    data: {
      skillName: string;
      priority?: any;
      currentLevel?: string;
      targetLevel?: string;
      rationale?: string;
    },
  ) {
    await this.getPlan(userId, planId);

    if (!data.skillName || !data.skillName.trim()) {
      throw new AppError('Skill name is required', 400);
    }

    const goal = await (prisma as any).learningGoal.create({
      data: {
        planId,
        skillName: data.skillName.trim(),
        priority: data.priority || 'MEDIUM',
        currentLevel: data.currentLevel || 'UNKNOWN',
        targetLevel: data.targetLevel || 'STRONG',
        status: 'TODO',
        rationale: data.rationale || null,
      },
      include: { tasks: true },
    });

    return goal;
  }

  /**
   * Update goal status/priority
   */
  async updateGoal(
    userId: string,
    goalId: string,
    data: {
      status?: any;
      priority?: any;
      currentLevel?: string;
      targetLevel?: string;
      rationale?: string;
    },
  ) {
    const goal = await (prisma as any).learningGoal.findUnique({
      where: { id: goalId },
      include: { plan: true },
    });

    if (!goal || goal.plan.userId !== userId) {
      throw new AppError('Learning goal not found', 404);
    }

    return (prisma as any).learningGoal.update({
      where: { id: goalId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...(data.currentLevel && { currentLevel: data.currentLevel }),
        ...(data.targetLevel && { targetLevel: data.targetLevel }),
        ...(data.rationale !== undefined && { rationale: data.rationale }),
      },
      include: { tasks: true },
    });
  }

  /**
   * Create task for a goal
   */
  async addTask(
    userId: string,
    data: {
      goalId: string;
      title: string;
      description?: string;
      type?: string;
      dueDate?: string | null;
      evidenceReference?: any;
    },
  ) {
    const goal = await (prisma as any).learningGoal.findUnique({
      where: { id: data.goalId },
      include: { plan: true },
    });

    if (!goal || goal.plan.userId !== userId) {
      throw new AppError('Learning goal not found', 404);
    }

    if (!data.title || !data.title.trim()) {
      throw new AppError('Task title is required', 400);
    }

    return (prisma as any).learningTask.create({
      data: {
        goalId: data.goalId,
        title: data.title.trim(),
        description: data.description || null,
        type: data.type || 'PRACTICE',
        status: 'TODO',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        evidenceReference: data.evidenceReference || null,
      },
    });
  }

  /**
   * Update task status (e.g. mark COMPLETED or SKIPPED)
   */
  async updateTask(
    userId: string,
    taskId: string,
    data: {
      status?: any;
      title?: string;
      description?: string;
      dueDate?: string | null;
      evidenceReference?: any;
    },
  ) {
    const task = await (prisma as any).learningTask.findUnique({
      where: { id: taskId },
      include: { goal: { include: { plan: true } } },
    });

    if (!task || task.goal.plan.userId !== userId) {
      throw new AppError('Learning task not found', 404);
    }

    const updatePayload: any = {};
    if (data.status) {
      updatePayload.status = data.status;
      if (data.status === 'COMPLETED') {
        updatePayload.completedAt = new Date();
      }
    }
    if (data.title) updatePayload.title = data.title.trim();
    if (data.description !== undefined)
      updatePayload.description = data.description;
    if (data.dueDate !== undefined) {
      updatePayload.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.evidenceReference !== undefined) {
      updatePayload.evidenceReference = data.evidenceReference;
    }

    return (prisma as any).learningTask.update({
      where: { id: taskId },
      data: updatePayload,
    });
  }

  /**
   * Delete task
   */
  async deleteTask(userId: string, taskId: string) {
    const task = await (prisma as any).learningTask.findUnique({
      where: { id: taskId },
      include: { goal: { include: { plan: true } } },
    });

    if (!task || task.goal.plan.userId !== userId) {
      throw new AppError('Learning task not found', 404);
    }

    await (prisma as any).learningTask.delete({
      where: { id: taskId },
    });

    return { message: 'Task deleted successfully' };
  }

  /**
   * Mark plan as completed and trigger a career snapshot
   */
  async completePlan(userId: string, planId: string) {
    const plan = await this.getPlan(userId, planId);

    const updated = await (prisma as any).learningPlan.update({
      where: { id: plan.id },
      data: { status: 'COMPLETED' },
      include: { goals: { include: { tasks: true } } },
    });

    // Record milestone in Career Snapshot
    try {
      await analyticsService.createSnapshot(userId);
    } catch {
      // Safe ignore
    }

    return updated;
  }
}

export const learningService = new LearningService();
