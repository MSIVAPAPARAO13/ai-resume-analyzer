import { prisma } from '../../config/database.js';
import { storageProvider } from './storage/local-storage.provider.js';
import { resumeParserService } from './parser/resume-parser.service.js';
import { scoringEngine } from './scoring/scoring.engine.js';
import { comparisonEngine } from './scoring/comparison.engine.js';
import { aiProvider } from './ai/mock-ai.provider.js';
import type { ParsedResumeData } from './parser/section.parser.js';
import {
  validateFileSignature,
  sanitizeFilename,
} from '../../middleware/file-validation.js';

export class ResumeService {
  /**
   * List all resumes for a user with latest version number and latest score.
   */
  async listResumes(userId: string) {
    const resumes = await (prisma as any).resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          select: {
            id: true,
            versionNumber: true,
            createdAt: true,
          },
        },
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            overallScore: true,
            atsScore: true,
            contentScore: true,
            skillsScore: true,
            createdAt: true,
          },
        },
      },
    });

    return resumes.map((r: any) => ({
      id: r.id,
      title: r.title,
      originalFileName: r.originalFileName,
      fileType: r.fileType,
      fileSize: r.fileSize,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      latestVersion: r.versions[0] || null,
      latestAnalysis: r.analyses[0] || null,
    }));
  }

  /**
   * Get single resume by ID, with all versions and latest analysis.
   */
  async getResume(userId: string, resumeId: string) {
    const resume = await (prisma as any).resume.findFirst({
      where: { id: resumeId, userId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!resume) {
      throw new Error('RESUME_NOT_FOUND');
    }

    return resume;
  }

  /**
   * Upload and process a new resume file.
   */
  async createResume(
    userId: string,
    file: {
      originalname: string;
      mimetype: string;
      buffer: Buffer;
      size: number;
    },
    customTitle?: string,
  ) {
    // 1. Validate file format (extension + MIME)
    const lowerName = file.originalname.toLowerCase();
    const isPdf =
      file.mimetype === 'application/pdf' || lowerName.endsWith('.pdf');
    const isDocx =
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword' ||
      lowerName.endsWith('.docx');

    if (!isPdf && !isDocx) {
      throw new Error('INVALID_FILE_TYPE');
    }

    // 1b. Magic-byte (file signature) validation — do not trust MIME/extension alone
    validateFileSignature(file.buffer, file.mimetype, file.originalname);

    // 1c. Sanitize the original filename to prevent path traversal
    const safeOriginalName = sanitizeFilename(file.originalname);

    // 2. Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('FILE_TOO_LARGE');
    }

    // 3. Store file securely (using sanitized filename)
    const { storageKey, size } = await storageProvider.upload(
      file.buffer,
      safeOriginalName,
      file.mimetype,
    );

    const title = customTitle || safeOriginalName.replace(/\.[^/.]+$/, '');

    // 4. Create initial Resume record
    const resume = await (prisma as any).resume.create({
      data: {
        userId,
        title,
        originalFileName: file.originalname,
        fileType: file.mimetype,
        fileSize: size,
        storageKey,
        status: 'PROCESSING',
      },
    });

    try {
      // 5. Extract text and parse structured sections
      const { extractedText, parsedData } =
        await resumeParserService.parseResume(
          file.buffer,
          file.mimetype,
          file.originalname,
        );

      // 6. Create Version 1
      const version = await (prisma as any).resumeVersion.create({
        data: {
          resumeId: resume.id,
          versionNumber: 1,
          extractedText,
          parsedData,
        },
      });

      // 7. Update status to READY
      const updatedResume = await (prisma as any).resume.update({
        where: { id: resume.id },
        data: { status: 'READY' },
        include: {
          versions: true,
        },
      });

      return {
        resume: updatedResume,
        version,
      };
    } catch (parseError: any) {
      // Mark as FAILED if parsing fails
      await (prisma as any).resume.update({
        where: { id: resume.id },
        data: { status: 'FAILED' },
      });

      throw parseError;
    }
  }

  /**
   * Delete resume, its storage file, and all associated versions/analyses.
   */
  async deleteResume(userId: string, resumeId: string) {
    const resume = await (prisma as any).resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new Error('RESUME_NOT_FOUND');
    }

    // Delete stored file
    if (resume.storageKey) {
      await storageProvider.delete(resume.storageKey);
    }

    // Delete database record (cascading deletes versions and analyses)
    await (prisma as any).resume.delete({
      where: { id: resumeId },
    });

    return { message: 'Resume deleted successfully' };
  }

  /**
   * Analyze a resume version and generate scores & Career Twin comparison.
   */
  async analyzeResume(userId: string, resumeId: string, versionId?: string) {
    const resume = await (prisma as any).resume.findFirst({
      where: { id: resumeId, userId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });

    if (!resume) {
      throw new Error('RESUME_NOT_FOUND');
    }

    // Select target version (latest or specific)
    const version = versionId
      ? resume.versions.find((v: any) => v.id === versionId)
      : resume.versions[0];

    if (!version) {
      throw new Error('VERSION_NOT_FOUND');
    }

    const parsedData: ParsedResumeData = version.parsedData as ParsedResumeData;
    const extractedText: string = version.extractedText || '';

    // Fetch user's Career Twin
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

    // 1. Calculate deterministic explainable score
    const scores = scoringEngine.calculateScores(parsedData, extractedText);

    // 2. Perform Career Twin comparison
    const careerComparison = comparisonEngine.compare(parsedData, careerTwin);

    // 3. Obtain AI insights / critiques (deterministic mock)
    const aiInsights = await aiProvider.analyzeResume(
      extractedText,
      parsedData,
      careerTwin,
    );

    // 4. Persist analysis
    const analysisPayload = {
      scores,
      careerComparison,
      aiInsights,
      analyzedAt: new Date().toISOString(),
    };

    const analysis = await (prisma as any).resumeAnalysis.create({
      data: {
        resumeId: resume.id,
        resumeVersionId: version.id,
        overallScore: scores.overallScore,
        atsScore: scores.atsScore,
        contentScore: scores.contentScore,
        skillsScore: scores.skillsScore,
        experienceScore: scores.experienceScore,
        educationScore: scores.educationScore,
        formattingScore: scores.formattingScore,
        summaryScore: scores.summaryScore,
        keywordScore: scores.keywordScore,
        result: analysisPayload,
      },
    });

    return {
      analysis,
      scores,
      careerComparison,
      aiInsights,
    };
  }

  /**
   * Get latest analysis for a resume.
   */
  async getLatestAnalysis(userId: string, resumeId: string) {
    const resume = await (prisma as any).resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true },
    });

    if (!resume) {
      throw new Error('RESUME_NOT_FOUND');
    }

    const analysis = await (prisma as any).resumeAnalysis.findFirst({
      where: { resumeId },
      orderBy: { createdAt: 'desc' },
      include: {
        version: {
          select: {
            id: true,
            versionNumber: true,
            parsedData: true,
            createdAt: true,
          },
        },
      },
    });

    if (!analysis) {
      throw new Error('ANALYSIS_NOT_FOUND');
    }

    return analysis;
  }

  /**
   * List version history for a resume.
   */
  async listVersions(userId: string, resumeId: string) {
    const resume = await (prisma as any).resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true },
    });

    if (!resume) {
      throw new Error('RESUME_NOT_FOUND');
    }

    return (prisma as any).resumeVersion.findMany({
      where: { resumeId },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        versionNumber: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get specific version text & structured sections.
   */
  async getVersion(userId: string, resumeId: string, versionId: string) {
    const resume = await (prisma as any).resume.findFirst({
      where: { id: resumeId, userId },
      select: { id: true },
    });

    if (!resume) {
      throw new Error('RESUME_NOT_FOUND');
    }

    const version = await (prisma as any).resumeVersion.findFirst({
      where: { id: versionId, resumeId },
    });

    if (!version) {
      throw new Error('VERSION_NOT_FOUND');
    }

    return version;
  }
}

export const resumeService = new ResumeService();
