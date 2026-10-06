import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/error-handler.js';
import type {
  ApplicationStatus,
  ApplicationEventType,
  Prisma,
} from '@prisma/client';

export interface CreateApplicationDto {
  jobId?: string | null;
  resumeVersionId?: string | null;
  tailoringSessionId?: string | null;
  company: string;
  role: string;
  jobUrl?: string | null;
  status?: ApplicationStatus;
  appliedAt?: string | null;
  followUpAt?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  notes?: string | null;
}

export interface UpdateApplicationDto {
  jobId?: string | null;
  resumeVersionId?: string | null;
  tailoringSessionId?: string | null;
  company?: string;
  role?: string;
  jobUrl?: string | null;
  status?: ApplicationStatus;
  appliedAt?: string | null;
  followUpAt?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  notes?: string | null;
}

export interface CreateEventDto {
  type: ApplicationEventType;
  description: string;
  eventDate?: string | null;
  metadata?: any;
}

export class ApplicationService {
  /**
   * Create an application and record the CREATED event
   */
  async createApplication(userId: string, data: CreateApplicationDto) {
    // If jobId provided, verify ownership
    if (data.jobId) {
      const job = await prisma.job.findFirst({
        where: { id: data.jobId, userId },
      });
      if (!job) {
        throw new AppError('Associated job not found', 404, 'NOT_FOUND');
      }
    }

    // If resumeVersionId provided, verify ownership through resume
    if (data.resumeVersionId) {
      const version = await prisma.resumeVersion.findFirst({
        where: {
          id: data.resumeVersionId,
          resume: { userId },
        },
      });
      if (!version) {
        throw new AppError(
          'Associated resume version not found',
          404,
          'NOT_FOUND',
        );
      }
    }

    // If tailoringSessionId provided, verify ownership
    if (data.tailoringSessionId) {
      const session = await prisma.resumeTailoringSession.findFirst({
        where: { id: data.tailoringSessionId, userId },
      });
      if (!session) {
        throw new AppError(
          'Associated tailoring session not found',
          404,
          'NOT_FOUND',
        );
      }
    }

    const status = data.status || 'SAVED';
    const appliedAt = data.appliedAt
      ? new Date(data.appliedAt)
      : status === 'APPLIED'
        ? new Date()
        : null;
    const followUpAt = data.followUpAt ? new Date(data.followUpAt) : null;

    const application = await prisma.application.create({
      data: {
        userId,
        jobId: data.jobId || null,
        resumeVersionId: data.resumeVersionId || null,
        tailoringSessionId: data.tailoringSessionId || null,
        company: data.company.trim(),
        role: data.role.trim(),
        jobUrl: data.jobUrl || null,
        status,
        appliedAt,
        followUpAt,
        recruiterName: data.recruiterName || null,
        recruiterEmail: data.recruiterEmail || null,
        notes: data.notes || null,
        events: {
          create: [
            {
              type: 'CREATED',
              description: `Application created for ${data.role} at ${data.company}`,
              eventDate: new Date(),
            },
            ...(status !== 'SAVED'
              ? [
                  {
                    type: (status === 'APPLIED'
                      ? 'APPLIED'
                      : status === 'ASSESSMENT'
                        ? 'ASSESSMENT'
                        : status === 'INTERVIEW'
                          ? 'INTERVIEW'
                          : status === 'OFFER'
                            ? 'OFFER'
                            : status === 'REJECTED'
                              ? 'REJECTED'
                              : 'NOTE') as ApplicationEventType,
                    description: `Initial status set to ${status}`,
                    eventDate: new Date(),
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        job: true,
        resumeVersion: {
          include: {
            resume: {
              select: { id: true, title: true, originalFileName: true },
            },
          },
        },
        events: {
          orderBy: { eventDate: 'desc' },
        },
      },
    });

    return application;
  }

  /**
   * List applications for user with optional filtering
   */
  async getApplications(
    userId: string,
    filters?: {
      status?: ApplicationStatus;
      search?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    const where: Prisma.ApplicationWhereInput = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { company: { contains: filters.search, mode: 'insensitive' } },
        { role: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters?.page ? Math.max(1, filters.page) : undefined;
    const pageSize = filters?.pageSize
      ? Math.min(100, Math.max(1, filters.pageSize))
      : undefined;
    const skip = page && pageSize ? (page - 1) * pageSize : undefined;

    const applications = await prisma.application.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            employmentType: true,
          },
        },
        resumeVersion: {
          include: {
            resume: {
              select: { id: true, title: true, originalFileName: true },
            },
          },
        },
        events: {
          orderBy: { eventDate: 'desc' },
          take: 1,
        },
      },
    });

    return applications;
  }

  /**
   * Get single application with deep relations (Job, Match, Resume, Tailoring, Events)
   */
  async getApplicationById(userId: string, id: string) {
    const application = await prisma.application.findFirst({
      where: { id, userId },
      include: {
        job: {
          include: {
            requirements: true,
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            matches: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        resumeVersion: {
          include: {
            resume: true,
            analyses: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        tailoringSession: {
          include: {
            suggestions: true,
          },
        },
        events: {
          orderBy: { eventDate: 'desc' },
        },
      },
    });

    if (!application) {
      throw new AppError('Application not found', 404, 'NOT_FOUND');
    }

    return application;
  }

  /**
   * Update application details
   */
  async updateApplication(
    userId: string,
    id: string,
    data: UpdateApplicationDto,
  ) {
    const existing = await prisma.application.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Application not found', 404, 'NOT_FOUND');
    }

    const updateData: Prisma.ApplicationUpdateInput = {};

    if (data.company !== undefined) updateData.company = data.company.trim();
    if (data.role !== undefined) updateData.role = data.role.trim();
    if (data.jobUrl !== undefined) updateData.jobUrl = data.jobUrl || null;
    if (data.recruiterName !== undefined)
      updateData.recruiterName = data.recruiterName || null;
    if (data.recruiterEmail !== undefined)
      updateData.recruiterEmail = data.recruiterEmail || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.appliedAt !== undefined)
      updateData.appliedAt = data.appliedAt ? new Date(data.appliedAt) : null;
    if (data.followUpAt !== undefined)
      updateData.followUpAt = data.followUpAt
        ? new Date(data.followUpAt)
        : null;

    if (data.jobId !== undefined) {
      if (data.jobId) {
        const job = await prisma.job.findFirst({
          where: { id: data.jobId, userId },
        });
        if (!job)
          throw new AppError('Associated job not found', 404, 'NOT_FOUND');
        updateData.job = { connect: { id: data.jobId } };
      } else {
        updateData.job = { disconnect: true };
      }
    }

    if (data.resumeVersionId !== undefined) {
      if (data.resumeVersionId) {
        const version = await prisma.resumeVersion.findFirst({
          where: { id: data.resumeVersionId, resume: { userId } },
        });
        if (!version)
          throw new AppError(
            'Associated resume version not found',
            404,
            'NOT_FOUND',
          );
        updateData.resumeVersion = { connect: { id: data.resumeVersionId } };
      } else {
        updateData.resumeVersion = { disconnect: true };
      }
    }

    if (data.tailoringSessionId !== undefined) {
      if (data.tailoringSessionId) {
        const session = await prisma.resumeTailoringSession.findFirst({
          where: { id: data.tailoringSessionId, userId },
        });
        if (!session)
          throw new AppError(
            'Associated tailoring session not found',
            404,
            'NOT_FOUND',
          );
        updateData.tailoringSession = {
          connect: { id: data.tailoringSessionId },
        };
      } else {
        updateData.tailoringSession = { disconnect: true };
      }
    }

    if (data.status !== undefined && data.status !== existing.status) {
      updateData.status = data.status;
      if (data.status === 'APPLIED' && !existing.appliedAt && !data.appliedAt) {
        updateData.appliedAt = new Date();
      }
    }

    const updated = await prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        job: true,
        resumeVersion: {
          include: {
            resume: {
              select: { id: true, title: true, originalFileName: true },
            },
          },
        },
        events: {
          orderBy: { eventDate: 'desc' },
        },
      },
    });

    // If status changed, record event
    if (data.status !== undefined && data.status !== existing.status) {
      await this.recordStatusEvent(id, data.status, data.notes);
    }

    return updated;
  }

  /**
   * Update status with explicit event creation
   */
  async updateStatus(
    userId: string,
    id: string,
    status: ApplicationStatus,
    notes?: string | null,
    eventDate?: string | null,
  ) {
    const existing = await prisma.application.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Application not found', 404, 'NOT_FOUND');
    }

    const appliedAt =
      status === 'APPLIED' && !existing.appliedAt
        ? new Date()
        : existing.appliedAt;

    await prisma.application.update({
      where: { id },
      data: {
        status,
        appliedAt,
      },
    });

    await this.recordStatusEvent(id, status, notes, eventDate);

    return this.getApplicationById(userId, id);
  }

  /**
   * Helper to record status change event
   */
  private async recordStatusEvent(
    applicationId: string,
    status: ApplicationStatus,
    notes?: string | null,
    eventDate?: string | null,
  ) {
    let eventType: ApplicationEventType = 'NOTE';
    switch (status) {
      case 'APPLIED':
        eventType = 'APPLIED';
        break;
      case 'ASSESSMENT':
        eventType = 'ASSESSMENT';
        break;
      case 'INTERVIEW':
        eventType = 'INTERVIEW';
        break;
      case 'OFFER':
        eventType = 'OFFER';
        break;
      case 'REJECTED':
        eventType = 'REJECTED';
        break;
      case 'WITHDRAWN':
        eventType = 'WITHDRAWN';
        break;
      case 'SAVED':
      default:
        eventType = 'NOTE';
        break;
    }

    const description = `Status transitioned to ${status}${notes ? ` — ${notes}` : ''}`;

    await prisma.applicationEvent.create({
      data: {
        applicationId,
        type: eventType,
        description,
        eventDate: eventDate ? new Date(eventDate) : new Date(),
        metadata: notes ? { notes } : undefined,
      },
    });
  }

  /**
   * Delete an application
   */
  async deleteApplication(userId: string, id: string) {
    const existing = await prisma.application.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new AppError('Application not found', 404, 'NOT_FOUND');
    }

    await prisma.application.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Add a timeline event to application
   */
  async createEvent(
    userId: string,
    applicationId: string,
    data: CreateEventDto,
  ) {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new AppError('Application not found', 404, 'NOT_FOUND');
    }

    const event = await prisma.applicationEvent.create({
      data: {
        applicationId,
        type: data.type,
        description: data.description.trim(),
        eventDate: data.eventDate ? new Date(data.eventDate) : new Date(),
        metadata: data.metadata || undefined,
      },
    });

    return event;
  }

  /**
   * Get all timeline events for application
   */
  async getEvents(userId: string, applicationId: string) {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId },
    });

    if (!application) {
      throw new AppError('Application not found', 404, 'NOT_FOUND');
    }

    return prisma.applicationEvent.findMany({
      where: { applicationId },
      orderBy: { eventDate: 'desc' },
    });
  }

  /**
   * Calculate descriptive CRM analytics for the dashboard
   */
  async getAnalytics(userId: string) {
    const applications = await prisma.application.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            matches: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        resumeVersion: {
          include: {
            resume: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    const totalApplications = applications.length;

    const statusCounts: Record<ApplicationStatus, number> = {
      SAVED: 0,
      APPLIED: 0,
      ASSESSMENT: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };

    let matchScoreSum = 0;
    let applicationsWithMatchCount = 0;

    const resumeUsageMap: Record<
      string,
      { title: string; versionNumber: number; count: number }
    > = {};

    for (const app of applications) {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }

      // Check match score
      const latestMatch = app.job?.matches?.[0];
      if (latestMatch && typeof latestMatch.overallScore === 'number') {
        matchScoreSum += latestMatch.overallScore;
        applicationsWithMatchCount++;
      }

      // Check resume version usage
      if (app.resumeVersion) {
        const key = app.resumeVersion.id;
        const title = app.resumeVersion.resume?.title || 'Resume';
        const vNum = app.resumeVersion.versionNumber;
        if (!resumeUsageMap[key]) {
          resumeUsageMap[key] = {
            title,
            versionNumber: vNum,
            count: 0,
          };
        }
        resumeUsageMap[key].count++;
      }
    }

    // Interview rate: interviews / applications * 100
    // (Notice: applications that reached interview include INTERVIEW + OFFER)
    const interviewCount = statusCounts.INTERVIEW + statusCounts.OFFER;
    const applicationToInterviewRate =
      totalApplications > 0
        ? Math.round((interviewCount / totalApplications) * 100)
        : 0;

    // Offer rate: offers / applications * 100
    const offerRate =
      totalApplications > 0
        ? Math.round((statusCounts.OFFER / totalApplications) * 100)
        : 0;

    const averageMatchScore =
      applicationsWithMatchCount > 0
        ? Math.round(matchScoreSum / applicationsWithMatchCount)
        : null;

    const resumeVersionUsage = Object.values(resumeUsageMap).sort(
      (a, b) => b.count - a.count,
    );

    return {
      totalApplications,
      statusCounts,
      applicationToInterviewRate,
      offerRate,
      averageMatchScore,
      resumeVersionUsage,
    };
  }
}

export const applicationService = new ApplicationService();
