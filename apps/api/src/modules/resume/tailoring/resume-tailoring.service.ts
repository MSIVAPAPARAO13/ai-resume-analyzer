import { prisma } from '../../../config/database.js';
import { AppError } from '../../../middleware/error-handler.js';
import { getAIProvider } from '../ai/ai.factory.js';
import { evidenceGuardService } from './evidence-guard.service.js';
import { scoringEngine } from '../scoring/scoring.engine.js';
import { comparisonEngine } from '../scoring/comparison.engine.js';
import type { ParsedResumeData } from '../parser/section.parser.js';

export interface CreateTailoringSessionOptions {
  forceRefresh?: boolean;
  provider?: 'GEMINI' | 'MOCK';
}

export class ResumeTailoringService {
  /**
   * Generates or retrieves an AI Resume Tailoring session
   */
  async generateTailoringSession(
    userId: string,
    resumeId: string,
    jobId: string,
    options?: CreateTailoringSessionOptions,
  ) {
    // 1. Verify user ownership of Resume
    const resume = await (prisma as any).resume.findFirst({
      where: { id: resumeId, userId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!resume) {
      throw new AppError('Resume not found or does not belong to you.', 404);
    }

    const latestVersion = resume.versions[0];
    if (!latestVersion) {
      throw new AppError('Resume has no processed versions to tailor.', 400);
    }

    // 2. Verify user ownership of Job
    const job = await (prisma as any).job.findFirst({
      where: { id: jobId, userId },
      include: {
        requirements: true,
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!job) {
      throw new AppError('Job not found or does not belong to you.', 404);
    }

    // 3. Cost control & caching: Check for existing session on identical resumeVersion & job
    if (!options?.forceRefresh) {
      const existingSession = await (
        prisma as any
      ).resumeTailoringSession.findFirst({
        where: {
          userId,
          resumeVersionId: latestVersion.id,
          jobId,
          status: { in: ['GENERATED', 'REVIEWING'] },
        },
        include: {
          suggestions: {
            orderBy: { createdAt: 'asc' },
          },
          job: {
            select: { id: true, title: true, company: true, location: true },
          },
          resumeVersion: {
            select: { id: true, versionNumber: true, createdAt: true },
          },
        },
      });

      if (existingSession) {
        return {
          session: existingSession,
          cached: true,
        };
      }
    }

    // 4. Fetch user's Career Twin
    const careerTwin = await (prisma as any).careerProfile.findUnique({
      where: { userId },
      include: {
        experiences: true,
        education: true,
        projects: true,
        skills: true,
        certifications: true,
        achievements: true,
      },
    });

    // 5. Build Job DNA context
    const jobAnalysis = job.analyses[0];
    const jobDna = jobAnalysis?.jobDna || {
      role: job.title,
      level: null,
      skills: job.requirements
        .filter((r: any) => r.type === 'SKILL')
        .map((r: any) => ({ name: r.name, importance: r.importance })),
      responsibilities: job.requirements
        .filter((r: any) => r.type === 'RESPONSIBILITY')
        .map((r: any) => r.name),
      keywords: job.requirements
        .filter((r: any) => r.type === 'KEYWORD')
        .map((r: any) => r.name),
      experienceRequirement: jobAnalysis?.experienceRequirement || null,
      educationRequirement: jobAnalysis?.educationRequirement || null,
    };

    const parsedResume: ParsedResumeData =
      (latestVersion.parsedData as ParsedResumeData) || {
        contact: {},
        summary: null,
        skills: [],
        experience: [],
        education: [],
        projects: [],
        certifications: [],
      };

    // 6. Invoke AI Provider
    const aiProvider = getAIProvider(options?.provider);
    let aiResult;
    try {
      aiResult = await aiProvider.generateTailoringSuggestions({
        resumeText: latestVersion.extractedText || '',
        parsedResume,
        careerTwin,
        jobDna,
        jobDescription: job.description,
      });

      // Track AI Usage
      await (prisma as any).aIUsage.create({
        data: {
          userId,
          provider: aiProvider.name,
          operation: 'RESUME_TAILORING',
          model:
            aiProvider.name === 'GEMINI' ? 'gemini-2.5-flash' : 'mock-tailor',
          requestCount: 1,
          status: 'SUCCESS',
        },
      });
    } catch (err: any) {
      await (prisma as any).aIUsage.create({
        data: {
          userId,
          provider: aiProvider.name,
          operation: 'RESUME_TAILORING',
          model:
            aiProvider.name === 'GEMINI' ? 'gemini-2.5-flash' : 'mock-tailor',
          requestCount: 1,
          status: 'FAILED',
        },
      });
      throw err;
    }

    // 7. Run suggestions through Evidence Guard
    const guardedResult = evidenceGuardService.evaluateSuggestions(
      aiResult.suggestions,
      careerTwin,
      parsedResume,
      jobDna,
    );

    // 8. Create ResumeTailoringSession in database
    const session = await (prisma as any).resumeTailoringSession.create({
      data: {
        userId,
        resumeVersionId: latestVersion.id,
        jobId,
        status: 'REVIEWING',
        suggestions: {
          create: guardedResult.suggestions.map((s) => ({
            type: s.type,
            originalText: s.original,
            proposedText: s.proposed,
            reason: s.guardExplanation
              ? `${s.reason} (${s.guardExplanation})`
              : s.reason,
            evidenceReferences: s.evidenceReferences || [],
            guardStatus: s.guardStatus,
            status: 'PENDING',
            confidence: s.confidence ?? 1.0,
            requiresUserApproval: s.requiresUserApproval ?? true,
          })),
        },
      },
      include: {
        suggestions: {
          orderBy: { createdAt: 'asc' },
        },
        job: {
          select: { id: true, title: true, company: true, location: true },
        },
        resumeVersion: {
          select: { id: true, versionNumber: true, createdAt: true },
        },
      },
    });

    return {
      session,
      cached: false,
      evidenceSummary: guardedResult.summary,
      guardCounts: {
        verified: guardedResult.verifiedCount,
        needsReview: guardedResult.needsReviewCount,
        unsupported: guardedResult.unsupportedCount,
      },
    };
  }

  /**
   * Get an existing tailoring session
   */
  async getSession(userId: string, sessionId: string) {
    const session = await (prisma as any).resumeTailoringSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        suggestions: {
          orderBy: { createdAt: 'asc' },
        },
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            source: true,
          },
        },
        resumeVersion: {
          select: {
            id: true,
            resumeId: true,
            versionNumber: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError(
        'Tailoring session not found or does not belong to you.',
        404,
      );
    }

    return session;
  }

  /**
   * Accept an individual tailoring suggestion
   */
  async acceptSuggestion(
    userId: string,
    sessionId: string,
    suggestionId: string,
  ) {
    const session = await (prisma as any).resumeTailoringSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });

    if (!session) {
      throw new AppError('Tailoring session not found or unauthorized.', 404);
    }

    const suggestion = await (
      prisma as any
    ).resumeTailoringSuggestion.findFirst({
      where: { id: suggestionId, sessionId },
    });

    if (!suggestion) {
      throw new AppError('Suggestion not found in this session.', 404);
    }

    const updated = await (prisma as any).resumeTailoringSuggestion.update({
      where: { id: suggestionId },
      data: { status: 'ACCEPTED' },
    });

    return updated;
  }

  /**
   * Reject an individual tailoring suggestion
   */
  async rejectSuggestion(
    userId: string,
    sessionId: string,
    suggestionId: string,
  ) {
    const session = await (prisma as any).resumeTailoringSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });

    if (!session) {
      throw new AppError('Tailoring session not found or unauthorized.', 404);
    }

    const suggestion = await (
      prisma as any
    ).resumeTailoringSuggestion.findFirst({
      where: { id: suggestionId, sessionId },
    });

    if (!suggestion) {
      throw new AppError('Suggestion not found in this session.', 404);
    }

    const updated = await (prisma as any).resumeTailoringSuggestion.update({
      where: { id: suggestionId },
      data: { status: 'REJECTED' },
    });

    return updated;
  }

  /**
   * Complete tailoring session:
   * Applies all ACCEPTED suggestions to create a brand new ResumeVersion
   * Preserves historical versions without modification!
   */
  async completeSession(userId: string, sessionId: string) {
    const session = await (prisma as any).resumeTailoringSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        suggestions: true,
        resumeVersion: {
          include: {
            resume: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError('Tailoring session not found or unauthorized.', 404);
    }

    if (session.status === 'COMPLETED') {
      return { session, message: 'Session has already been completed.' };
    }

    const acceptedSuggestions = session.suggestions.filter(
      (s: any) => s.status === 'ACCEPTED',
    );

    const baseParsed: ParsedResumeData = JSON.parse(
      JSON.stringify(session.resumeVersion.parsedData || {}),
    );
    let updatedText = session.resumeVersion.extractedText || '';

    // Apply accepted suggestions
    for (const sug of acceptedSuggestions) {
      if (sug.type === 'SUMMARY_UPDATE') {
        baseParsed.summary = sug.proposedText;
        if (sug.originalText && updatedText.includes(sug.originalText)) {
          updatedText = updatedText.replace(sug.originalText, sug.proposedText);
        } else {
          updatedText = `${sug.proposedText}\n\n${updatedText}`;
        }
      } else if (sug.type === 'KEYWORD_ALIGNMENT') {
        const newSkillNames = sug.proposedText
          .split(/[•,]/)
          .map((s: string) => s.trim())
          .filter(Boolean);
        for (const name of newSkillNames) {
          if (
            !baseParsed.skills.some(
              (sk) => sk.name.toLowerCase() === name.toLowerCase(),
            )
          ) {
            baseParsed.skills.unshift({ name, category: 'Technical' });
          }
        }
      } else if (sug.type === 'REWRITE') {
        if (sug.originalText && updatedText.includes(sug.originalText)) {
          updatedText = updatedText.replace(sug.originalText, sug.proposedText);
        }
        for (const exp of baseParsed.experience || []) {
          if (exp.bullets) {
            for (let i = 0; i < exp.bullets.length; i++) {
              if (
                exp.bullets[i] === sug.originalText ||
                sug.originalText.includes(exp.bullets[i])
              ) {
                exp.bullets[i] = sug.proposedText;
              }
            }
          }
          if (
            exp.description &&
            (exp.description === sug.originalText ||
              exp.description.includes(sug.originalText))
          ) {
            exp.description = exp.description.replace(
              sug.originalText,
              sug.proposedText,
            );
          }
        }
      } else if (sug.type === 'PROJECT_EMPHASIS') {
        for (const proj of baseParsed.projects || []) {
          if (
            proj.description &&
            (proj.description === sug.originalText ||
              proj.description.includes(sug.originalText))
          ) {
            proj.description = sug.proposedText;
          }
        }
      }
    }

    // Determine next version number
    const maxVersion = await (prisma as any).resumeVersion.aggregate({
      where: { resumeId: session.resumeVersion.resumeId },
      _max: { versionNumber: true },
    });

    const nextVersionNumber = (maxVersion._max?.versionNumber || 1) + 1;

    // Create the NEW ResumeVersion
    const newVersion = await (prisma as any).resumeVersion.create({
      data: {
        resumeId: session.resumeVersion.resumeId,
        versionNumber: nextVersionNumber,
        extractedText: updatedText,
        parsedData: baseParsed,
      },
    });

    // Score the new version immediately
    const careerTwin = await (prisma as any).careerProfile.findUnique({
      where: { userId },
      include: {
        experiences: true,
        education: true,
        projects: true,
        skills: true,
        certifications: true,
        achievements: true,
      },
    });

    const scores = scoringEngine.calculateScores(baseParsed, updatedText);
    const careerComparison = comparisonEngine.compare(baseParsed, careerTwin);

    await (prisma as any).resumeAnalysis.create({
      data: {
        resumeId: session.resumeVersion.resumeId,
        resumeVersionId: newVersion.id,
        overallScore: scores.overallScore,
        atsScore: scores.atsScore,
        contentScore: scores.contentScore,
        skillsScore: scores.skillsScore,
        experienceScore: scores.experienceScore,
        educationScore: scores.educationScore,
        formattingScore: scores.formattingScore,
        summaryScore: scores.summaryScore,
        keywordScore: scores.keywordScore,
        result: {
          scores,
          careerComparison,
          tailoredFromSessionId: session.id,
        },
      },
    });

    // Mark session as COMPLETED
    const updatedSession = await (prisma as any).resumeTailoringSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
      include: {
        suggestions: true,
      },
    });

    return {
      session: updatedSession,
      newVersion,
      appliedCount: acceptedSuggestions.length,
    };
  }
}

export const resumeTailoringService = new ResumeTailoringService();
