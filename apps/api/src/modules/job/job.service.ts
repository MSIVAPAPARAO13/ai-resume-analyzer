import { prisma } from '../../config/database.js';
import {
  CreateJobInput,
  JobDna,
  MatchResult,
  UpdateJobInput,
} from './job.validation.js';
import { ManualJobProvider } from './providers/manual-job.provider.js';
import { DeterministicJobDescriptionParser } from './parser/job-description.parser.js';
import { ResumeJobMatchingEngine } from './matching/resume-job-matching.engine.js';
import { CareerTwinContext } from './matching/matching.interface.js';

export class JobService {
  private manualProvider = new ManualJobProvider();
  private parser = new DeterministicJobDescriptionParser();
  private matchingEngine = new ResumeJobMatchingEngine();

  // ─── 1. Job CRUD ─────────────────────────────────────────────────────────────

  async createJob(userId: string, input: CreateJobInput) {
    const rawPayload = await this.manualProvider.fetchJob(input);

    const job = await prisma.job.create({
      data: {
        userId,
        title: rawPayload.title,
        company: rawPayload.company,
        location: rawPayload.location,
        employmentType: rawPayload.employmentType,
        source: rawPayload.source,
        sourceUrl: rawPayload.sourceUrl,
        description: rawPayload.description,
        status: 'SAVED',
      },
    });

    return job;
  }

  async listJobs(userId: string) {
    const jobs = await prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        matches: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return jobs.map((j) => ({
      ...j,
      latestAnalysis: j.analyses[0] || null,
      latestMatch: j.matches[0] || null,
    }));
  }

  async getJobById(userId: string, jobId: string) {
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId },
      include: {
        requirements: {
          orderBy: { createdAt: 'asc' },
        },
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        matches: {
          orderBy: { createdAt: 'desc' },
          include: {
            resumeVersion: {
              include: {
                resume: {
                  select: { id: true, title: true, originalFileName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!job) {
      const err = new Error('Job not found or access denied') as any;
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return {
      ...job,
      latestAnalysis: job.analyses[0] || null,
      latestMatch: job.matches[0] || null,
    };
  }

  async updateJob(userId: string, jobId: string, input: UpdateJobInput) {
    // Verify existence & ownership
    await this.getJobById(userId, jobId);

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.company !== undefined && { company: input.company.trim() }),
        ...(input.location !== undefined && {
          location: input.location?.trim() || null,
        }),
        ...(input.employmentType !== undefined && {
          employmentType: input.employmentType?.trim() || null,
        }),
        ...(input.sourceUrl !== undefined && {
          sourceUrl: input.sourceUrl?.trim() || null,
        }),
        ...(input.description !== undefined && {
          description: input.description.trim(),
        }),
        ...(input.status !== undefined && { status: input.status }),
      },
    });

    return updated;
  }

  async deleteJob(userId: string, jobId: string) {
    // Verify existence & ownership
    await this.getJobById(userId, jobId);

    await prisma.job.delete({
      where: { id: jobId },
    });

    return { deleted: true };
  }

  // ─── 2. Job Analysis & Job DNA ───────────────────────────────────────────────

  async analyzeJob(userId: string, jobId: string) {
    const job = await this.getJobById(userId, jobId);

    // Parse Job Description into structured Job DNA
    const jobDna: JobDna = await this.parser.parse(job.title, job.description);

    // Replace previous requirements in transaction
    await prisma.$transaction(async (tx) => {
      await tx.jobRequirement.deleteMany({
        where: { jobId },
      });

      // Prepare requirement records
      const reqRecords: Array<{
        jobId: string;
        type:
          | 'SKILL'
          | 'RESPONSIBILITY'
          | 'EXPERIENCE'
          | 'EDUCATION'
          | 'KEYWORD';
        name: string;
        importance: 'REQUIRED' | 'PREFERRED' | 'NICE_TO_HAVE';
        evidence?: string | null;
      }> = [];

      for (const skill of jobDna.requiredSkills) {
        reqRecords.push({
          jobId,
          type: 'SKILL',
          name: skill,
          importance: 'REQUIRED',
          evidence: 'Listed as required skill qualification in Job Description',
        });
      }

      for (const skill of jobDna.preferredSkills) {
        reqRecords.push({
          jobId,
          type: 'SKILL',
          name: skill,
          importance: 'PREFERRED',
          evidence: 'Listed as preferred / bonus skill qualification',
        });
      }

      for (const resp of jobDna.responsibilities) {
        reqRecords.push({
          jobId,
          type: 'RESPONSIBILITY',
          name: resp,
          importance: 'REQUIRED',
          evidence: 'Core job duty extracted from responsibilities section',
        });
      }

      if (jobDna.experienceRequirement.raw) {
        reqRecords.push({
          jobId,
          type: 'EXPERIENCE',
          name: jobDna.experienceRequirement.raw,
          importance: 'REQUIRED',
          evidence: jobDna.experienceRequirement.details || null,
        });
      }

      if (jobDna.educationRequirement.raw) {
        reqRecords.push({
          jobId,
          type: 'EDUCATION',
          name: jobDna.educationRequirement.raw,
          importance: 'REQUIRED',
          evidence: `Degree: ${jobDna.educationRequirement.degree || 'Relevant degree'}`,
        });
      }

      for (const kw of jobDna.keywords) {
        reqRecords.push({
          jobId,
          type: 'KEYWORD',
          name: kw,
          importance: 'NICE_TO_HAVE',
          evidence: 'Key technical / architectural domain term',
        });
      }

      if (reqRecords.length > 0) {
        await tx.jobRequirement.createMany({
          data: reqRecords,
        });
      }

      // Create Job Analysis record
      await tx.jobAnalysis.create({
        data: {
          jobId,
          role: jobDna.role,
          level: jobDna.level,
          summary: jobDna.summary,
          experienceRequirement: jobDna.experienceRequirement.raw,
          educationRequirement: jobDna.educationRequirement.raw,
          jobDna: jobDna as any,
        },
      });

      // Update Job status
      await tx.job.update({
        where: { id: jobId },
        data: { status: 'ANALYZED' },
      });
    });

    return this.getJobById(userId, jobId);
  }

  async getJobAnalysis(userId: string, jobId: string) {
    const job = await this.getJobById(userId, jobId);

    if (!job.latestAnalysis) {
      const err = new Error(
        'Job has not been analyzed yet. Run analysis first.',
      ) as any;
      err.statusCode = 404;
      err.code = 'NOT_ANALYZED';
      throw err;
    }

    return job.latestAnalysis;
  }

  // ─── 3. Resume ↔ Job Matching ───────────────────────────────────────────────

  async matchResume(userId: string, jobId: string, resumeId: string) {
    // 1. Verify Job ownership & analysis
    const job = await this.getJobById(userId, jobId);
    let analysis = job.latestAnalysis;
    if (!analysis) {
      const analyzedJob = await this.analyzeJob(userId, jobId);
      analysis = analyzedJob.latestAnalysis;
    }

    const jobDna =
      (analysis?.jobDna as JobDna) ||
      (await this.parser.parse(job.title, job.description));

    // 2. Verify Resume ownership & get latest version
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!resume || resume.versions.length === 0) {
      const err = new Error(
        'Resume not found or has no parsed versions',
      ) as any;
      err.statusCode = 404;
      err.code = 'RESUME_NOT_FOUND';
      throw err;
    }

    const latestVersion = resume.versions[0];
    const parsedData = latestVersion.parsedData || {};
    const extractedText = latestVersion.extractedText || '';

    // 3. Fetch Career Twin context for candidate
    const careerProfile = await prisma.careerProfile.findUnique({
      where: { userId },
      include: {
        skills: true,
        experiences: true,
        projects: true,
        education: true,
      },
    });

    const careerTwinContext: CareerTwinContext | null = careerProfile
      ? {
          headline: careerProfile.headline,
          summary: careerProfile.summary,
          targetRole: careerProfile.targetRole,
          skills: careerProfile.skills.map((s) => ({
            name: s.name,
            category: s.category,
            proficiency: s.proficiency,
          })),
          experiences: careerProfile.experiences.map((e) => ({
            title: e.title,
            company: e.company,
            startDate: e.startDate,
            endDate: e.endDate,
            isCurrent: e.isCurrent,
            description: e.description,
          })),
          education: careerProfile.education.map((ed) => ({
            degree: ed.degree,
            institution: ed.institution,
            fieldOfStudy: ed.fieldOfStudy,
          })),
          projects: careerProfile.projects.map((p) => ({
            name: p.name,
            description: p.description,
            technologies: p.technologies,
          })),
        }
      : null;

    // 4. Run Matching Engine
    const matchResult: MatchResult = await this.matchingEngine.match({
      parsedResume: parsedData,
      extractedText,
      jobDna,
      careerTwin: careerTwinContext,
    });

    // 5. Persist JobMatch record
    const matchRecord = await prisma.jobMatch.create({
      data: {
        jobId,
        resumeVersionId: latestVersion.id,
        overallScore: matchResult.scores.overallScore,
        skillsScore: matchResult.scores.skillsScore,
        experienceScore: matchResult.scores.experienceScore,
        responsibilitiesScore: matchResult.scores.responsibilitiesScore,
        educationScore: matchResult.scores.educationScore,
        keywordScore: matchResult.scores.keywordScore,
        careerTwinScore: matchResult.scores.careerTwinScore,
        result: matchResult as any,
      },
      include: {
        resumeVersion: {
          include: {
            resume: {
              select: { id: true, title: true, originalFileName: true },
            },
          },
        },
      },
    });

    return matchRecord;
  }

  async getJobMatches(userId: string, jobId: string) {
    // Verify ownership
    await this.getJobById(userId, jobId);

    const matches = await prisma.jobMatch.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: {
        resumeVersion: {
          include: {
            resume: {
              select: { id: true, title: true, originalFileName: true },
            },
          },
        },
      },
    });

    return matches;
  }

  async getJobMatchById(userId: string, jobId: string, matchId: string) {
    // Verify ownership
    await this.getJobById(userId, jobId);

    const match = await prisma.jobMatch.findFirst({
      where: { id: matchId, jobId },
      include: {
        resumeVersion: {
          include: {
            resume: {
              select: { id: true, title: true, originalFileName: true },
            },
          },
        },
      },
    });

    if (!match) {
      const err = new Error('Job match result not found') as any;
      err.statusCode = 404;
      err.code = 'MATCH_NOT_FOUND';
      throw err;
    }

    return match;
  }
}
