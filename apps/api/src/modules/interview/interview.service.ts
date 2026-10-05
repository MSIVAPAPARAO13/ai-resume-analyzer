import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error-handler.js';
import { defaultAIProvider } from '../resume/ai/ai.factory.js';
import type { AIProvider } from '../resume/ai/ai.interface.js';
import { calendarService } from '../calendar/calendar.service.js';
import { emailService } from '../email/email.service.js';

export interface CreateInterviewDto {
  title: string;
  mode?: 'PREPARATION' | 'MOCK_INTERVIEW';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  applicationId?: string | null;
  jobId?: string | null;
  resumeVersionId?: string | null;
  tailoringSessionId?: string | null;
}

export interface UpdateInterviewDto {
  title?: string;
  mode?: 'PREPARATION' | 'MOCK_INTERVIEW';
  status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  notes?: string | null;
}

export class InterviewService {
  private ai: AIProvider;

  constructor(aiProvider?: AIProvider) {
    this.ai = aiProvider || defaultAIProvider;
  }

  setAIProvider(aiProvider: AIProvider) {
    this.ai = aiProvider;
  }

  async createInterview(userId: string, data: CreateInterviewDto) {
    // Validate relations ownership if provided
    if (data.applicationId) {
      const app = await (prisma as any).application.findFirst({
        where: { id: data.applicationId, userId },
      });
      if (!app)
        throw new AppError('Application not found or unauthorized', 404);
    }

    if (data.resumeVersionId) {
      const rv = await (prisma as any).resumeVersion.findFirst({
        where: { id: data.resumeVersionId, resume: { userId } },
      });
      if (!rv)
        throw new AppError('Resume version not found or unauthorized', 404);
    }

    if (data.tailoringSessionId) {
      const ts = await (prisma as any).resumeTailoringSession.findFirst({
        where: { id: data.tailoringSessionId, resume: { userId } },
      });
      if (!ts)
        throw new AppError('Tailoring session not found or unauthorized', 404);
    }

    return (prisma as any).interviewSession.create({
      data: {
        userId,
        title: data.title,
        mode: data.mode || 'PREPARATION',
        difficulty: data.difficulty || 'MEDIUM',
        status: 'DRAFT',
        applicationId: data.applicationId || null,
        jobId: data.jobId || null,
        resumeVersionId: data.resumeVersionId || null,
        tailoringSessionId: data.tailoringSessionId || null,
      },
      include: {
        application: {
          select: { id: true, company: true, role: true, status: true },
        },
        job: {
          select: { id: true, title: true, company: true },
        },
      },
    });
  }

  async listInterviews(userId: string) {
    return (prisma as any).interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        application: {
          select: { id: true, company: true, role: true, status: true },
        },
        job: {
          select: { id: true, title: true, company: true },
        },
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  async getInterview(userId: string, sessionId: string) {
    const session = await (prisma as any).interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        application: true,
        job: true,
        resumeVersion: true,
        tailoringSession: true,
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            answers: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        reminders: true,
      },
    });

    if (!session) {
      throw new AppError('Interview session not found', 404);
    }

    return session;
  }

  async updateInterview(
    userId: string,
    sessionId: string,
    data: UpdateInterviewDto,
  ) {
    await this.getInterview(userId, sessionId);

    return (prisma as any).interviewSession.update({
      where: { id: sessionId },
      data: {
        ...data,
        completedAt: data.status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }

  async deleteInterview(userId: string, sessionId: string) {
    await this.getInterview(userId, sessionId);

    await (prisma as any).interviewSession.delete({
      where: { id: sessionId },
    });

    return { message: 'Interview session deleted successfully' };
  }

  async generateQuestions(
    userId: string,
    sessionId: string,
    options: {
      questionCount?: number;
      targetRole?: string;
      targetCompany?: string;
    } = {},
  ) {
    const session = await this.getInterview(userId, sessionId);

    // Gather grounded context: Career Twin, ResumeVersion, Job DNA, Application
    const careerTwin = await (prisma as any).careerProfile.findUnique({
      where: { userId },
      include: {
        skills: true,
        experiences: true,
        projects: true,
        education: true,
        certifications: true,
      },
    });

    let resumeData: any = null;
    if (session.resumeVersion?.parsedData) {
      resumeData = session.resumeVersion.parsedData;
    }

    let jobDna: any = null;
    if (session.job?.dna) {
      jobDna = session.job.dna;
    }

    // Check for match data if job exists
    let matchData: any = null;
    if (session.jobId && session.resumeVersionId) {
      const match = await (prisma as any).resumeJobMatch.findFirst({
        where: {
          jobId: session.jobId,
          resumeVersionId: session.resumeVersionId,
        },
      });
      if (match) {
        matchData = {
          overallScore: match.overallScore,
          strongSkills: match.strongSkills,
          partialSkills: match.partialSkills,
          missingSkills: match.missingSkills,
        };
      }
    }

    const role =
      options.targetRole ||
      session.job?.title ||
      session.application?.role ||
      careerTwin?.targetRole ||
      'Software Engineer';

    const company =
      options.targetCompany ||
      session.job?.company ||
      session.application?.company ||
      null;

    const result = await this.ai.generateInterviewQuestions({
      role,
      company,
      mode: session.mode,
      difficulty: session.difficulty,
      questionCount: options.questionCount || 10,
      careerTwin,
      resumeData,
      jobDna,
      matchData,
      tailoringProvenance: session.tailoringSession?.provenance || null,
    });

    // Delete existing un-answered questions or append with orderIndex
    const existingCount = await (prisma as any).interviewQuestion.count({
      where: { sessionId },
    });

    const createdQuestions = await prisma.$transaction(
      result.questions.map((q, idx) =>
        (prisma as any).interviewQuestion.create({
          data: {
            sessionId,
            category: q.category,
            difficulty: q.difficulty,
            question: q.question,
            whyAsked: q.whyAsked,
            expectedSignals: q.expectedSignals,
            evidenceReferences: q.evidenceReferences as any,
            preparationTips: q.preparationTips,
            orderIndex: existingCount + idx,
          },
        }),
      ),
    );

    // Update status to IN_PROGRESS if DRAFT
    if (session.status === 'DRAFT') {
      await (prisma as any).interviewSession.update({
        where: { id: sessionId },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      });
    }

    return {
      sessionTitle: session.title,
      overallTheme: result.overallTheme,
      focusAreas: result.focusAreas,
      questions: createdQuestions,
    };
  }

  async listQuestions(userId: string, sessionId: string) {
    await this.getInterview(userId, sessionId);

    return (prisma as any).interviewQuestion.findMany({
      where: { sessionId },
      orderBy: { orderIndex: 'asc' },
      include: {
        answers: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    questionId: string,
    data: { answerText: string; isDraft?: boolean },
  ) {
    await this.getInterview(userId, sessionId);

    const question = await (prisma as any).interviewQuestion.findFirst({
      where: { id: questionId, sessionId },
    });

    if (!question) {
      throw new AppError('Interview question not found', 404);
    }

    const answer = await (prisma as any).interviewAnswer.create({
      data: {
        questionId,
        answerText: data.answerText,
        submittedAt: data.isDraft ? null : new Date(),
      },
    });

    return answer;
  }

  async listAnswers(userId: string, sessionId: string, questionId: string) {
    await this.getInterview(userId, sessionId);

    return (prisma as any).interviewAnswer.findMany({
      where: { questionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async evaluateAnswer(
    userId: string,
    sessionId: string,
    questionId: string,
    answerId?: string,
  ) {
    await this.getInterview(userId, sessionId);

    const question = await (prisma as any).interviewQuestion.findFirst({
      where: { id: questionId, sessionId },
      include: {
        answers: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!question) {
      throw new AppError('Interview question not found', 404);
    }

    const targetAnswer = answerId
      ? await (prisma as any).interviewAnswer.findUnique({
          where: { id: answerId },
        })
      : question.answers[0];

    if (!targetAnswer) {
      throw new AppError('No answer submitted for this question yet', 400);
    }

    const evaluation = await this.ai.evaluateInterviewAnswer({
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      whyAsked: question.whyAsked,
      expectedSignals: question.expectedSignals,
      answerText: targetAnswer.answerText,
    });

    // Update answer record with feedback
    const updatedAnswer = await (prisma as any).interviewAnswer.update({
      where: { id: targetAnswer.id },
      data: {
        score: evaluation.score,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        missingPoints: evaluation.missingPoints,
        improvementSuggestions: evaluation.improvementSuggestions,
        evidenceAlignment: evaluation.evidenceAlignment || null,
      },
    });

    return {
      answer: updatedAnswer,
      evaluation,
    };
  }

  async getPreparationPlan(userId: string, sessionId: string) {
    const session = await this.getInterview(userId, sessionId);

    const careerTwin = await (prisma as any).careerProfile.findUnique({
      where: { userId },
      include: { skills: true, experiences: true, projects: true },
    });

    const role =
      session.job?.title ||
      session.application?.role ||
      careerTwin?.targetRole ||
      'Software Engineer';

    const company =
      session.job?.company || session.application?.company || null;

    let matchData: any = null;
    if (session.jobId && session.resumeVersionId) {
      const match = await (prisma as any).resumeJobMatch.findFirst({
        where: {
          jobId: session.jobId,
          resumeVersionId: session.resumeVersionId,
        },
      });
      if (match) {
        matchData = {
          missingSkills: match.missingSkills,
          partialSkills: match.partialSkills,
          strongSkills: match.strongSkills,
        };
      }
    }

    return this.ai.generateInterviewPreparationPlan({
      role,
      company,
      durationDays: 5,
      jobDna: session.job?.dna || null,
      matchData,
      careerTwin,
      resumeData: session.resumeVersion?.parsedData || null,
    });
  }

  async completeSession(userId: string, sessionId: string) {
    const session = await this.getInterview(userId, sessionId);

    // Calculate overallScore from answered questions
    const allAnswers = await (prisma as any).interviewAnswer.findMany({
      where: {
        question: { sessionId },
        score: { not: null },
      },
    });

    const scores = allAnswers.map((a: any) => a.score as number);
    const overallScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
          )
        : 75;

    const updated = await (prisma as any).interviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        overallScore,
      },
    });

    // Send transactional completion email if user has email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      try {
        await emailService.sendInterviewPreparationCompletedEmail({
          to: user.email,
          userName: user.name || 'Candidate',
          interviewTitle: session.title,
          overallScore,
        });
      } catch {
        // Safe ignore email delivery failure
      }
    }

    return updated;
  }

  async getFinalReport(userId: string, sessionId: string) {
    const session = await this.getInterview(userId, sessionId);

    const questions = await (prisma as any).interviewQuestion.findMany({
      where: { sessionId },
      include: {
        answers: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const questionsWithAnswers = questions.map((q: any) => {
      const ans = q.answers[0];
      return {
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        answerText: ans?.answerText || 'Not answered',
        score: ans?.score || null,
        strengths: ans?.strengths || [],
        weaknesses: ans?.weaknesses || [],
        missingPoints: ans?.missingPoints || [],
      };
    });

    const role =
      session.job?.title || session.application?.role || 'Software Engineer';
    const company =
      session.job?.company || session.application?.company || null;

    const report = await this.ai.generateInterviewFinalReport({
      sessionTitle: session.title,
      role,
      company,
      questionsWithAnswers,
    });

    return {
      session: {
        id: session.id,
        title: session.title,
        status: session.status,
        overallScore: session.overallScore || report.overallPreparationScore,
        completedAt: session.completedAt,
      },
      report,
    };
  }

  async scheduleCalendarEvent(
    userId: string,
    sessionId: string,
    eventData: {
      summary?: string;
      description?: string;
      startTime: string;
      endTime: string;
      timeZone?: string;
      includeNotes?: boolean;
    },
  ) {
    const session = await this.getInterview(userId, sessionId);

    const company =
      session.application?.company || session.job?.company || 'Company';
    const role = session.application?.role || session.job?.title || 'Role';

    const defaultTitle = `Interview Preparation / Interview — ${company} — ${role}`;
    const summary = eventData.summary || defaultTitle;

    const descParts = [
      `Interview: ${session.title}`,
      `Role: ${role}`,
      `Company: ${company}`,
      `Preparation Link: /interviews/${session.id}`,
    ];

    if (eventData.includeNotes && session.notes) {
      descParts.push(`Notes: ${session.notes}`);
    }

    const description = eventData.description || descParts.join('\n');

    const calendarResult = await calendarService.createInterviewCalendarEvent(
      userId,
      {
        summary,
        description,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        timeZone: eventData.timeZone || 'UTC',
      },
    );

    // Also schedule reminder record in DB
    await (prisma as any).interviewReminder.create({
      data: {
        sessionId,
        remindAt: new Date(
          new Date(eventData.startTime).getTime() - 24 * 60 * 60 * 1000,
        ), // 24h before
        type: 'BOTH',
      },
    });

    // Send transactional scheduled email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      try {
        await emailService.sendInterviewScheduledEmail({
          to: user.email,
          userName: user.name || 'Candidate',
          interviewTitle: session.title,
          company,
          role,
          scheduledTime: eventData.startTime,
        });
      } catch {
        // Safe ignore
      }
    }

    return {
      message: 'Calendar event added successfully',
      event: calendarResult,
    };
  }
}

export const interviewService = new InterviewService();
