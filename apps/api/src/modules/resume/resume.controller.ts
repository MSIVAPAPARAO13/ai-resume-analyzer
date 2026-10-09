import type { Request, Response, NextFunction } from 'express';
import { resumeService } from './resume.service.js';
import { AppError } from '../../middleware/error-handler.js';

function getUserId(req: Request): string {
  const user = (req as any).user;
  const id = user?.userId || user?.id;
  if (!id) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  return id;
}

function getParam(req: Request, paramName: string): string {
  const val = req.params[paramName];
  if (!val || typeof val !== 'string') {
    throw new AppError(
      `Missing ${paramName} parameter`,
      400,
      'VALIDATION_ERROR',
    );
  }
  return val;
}

export class ResumeController {
  // GET /api/v1/resumes
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const resumes = await resumeService.listResumes(userId);
      res.status(200).json({
        success: true,
        data: { resumes },
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/resumes/:id
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const resumeId = getParam(req, 'id');
      const resume = await resumeService.getResume(userId, resumeId);
      res.status(200).json({
        success: true,
        data: { resume },
      });
    } catch (err: any) {
      if (err.message === 'RESUME_NOT_FOUND') {
        return next(new AppError('Resume not found', 404, 'NOT_FOUND'));
      }
      next(err);
    }
  }

  // POST /api/v1/resumes (multipart/form-data)
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const file = req.file;

      if (!file) {
        return next(
          new AppError(
            'A resume file (PDF or DOCX) is required',
            400,
            'VALIDATION_ERROR',
          ),
        );
      }

      const title =
        typeof req.body.title === 'string' && req.body.title.trim()
          ? req.body.title.trim()
          : undefined;

      const result = await resumeService.createResume(userId, file, title);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err.message === 'INVALID_FILE_TYPE') {
        return next(
          new AppError(
            'Only PDF and DOCX files are supported',
            400,
            'INVALID_FILE_TYPE',
          ),
        );
      }
      if (err.message === 'FILE_TOO_LARGE') {
        return next(
          new AppError(
            'File size exceeds the 10MB limit',
            400,
            'FILE_TOO_LARGE',
          ),
        );
      }
      if (err.message === 'EMPTY_DOCUMENT') {
        return next(
          new AppError(
            'The uploaded file appears to be empty or unreadable',
            400,
            'EMPTY_DOCUMENT',
          ),
        );
      }
      next(err);
    }
  }

  // DELETE /api/v1/resumes/:id
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = getUserId(req);
      const resumeId = getParam(req, 'id');
      const result = await resumeService.deleteResume(userId, resumeId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err.message === 'RESUME_NOT_FOUND') {
        return next(new AppError('Resume not found', 404, 'NOT_FOUND'));
      }
      next(err);
    }
  }

  // POST /api/v1/resumes/:id/analyze
  async analyze(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = getUserId(req);
      const resumeId = getParam(req, 'id');
      const versionId =
        typeof req.body?.versionId === 'string'
          ? req.body.versionId
          : undefined;

      const result = await resumeService.analyzeResume(
        userId,
        resumeId,
        versionId,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      if (err.message === 'RESUME_NOT_FOUND') {
        return next(new AppError('Resume not found', 404, 'NOT_FOUND'));
      }
      if (err.message === 'VERSION_NOT_FOUND') {
        return next(
          new AppError('Specified resume version not found', 404, 'NOT_FOUND'),
        );
      }
      next(err);
    }
  }

  // GET /api/v1/resumes/:id/analysis
  async getAnalysis(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = getUserId(req);
      const resumeId = getParam(req, 'id');
      const analysis = await resumeService.getLatestAnalysis(userId, resumeId);

      res.status(200).json({
        success: true,
        data: { analysis },
      });
    } catch (err: any) {
      if (err.message === 'RESUME_NOT_FOUND') {
        return next(new AppError('Resume not found', 404, 'NOT_FOUND'));
      }
      if (err.message === 'ANALYSIS_NOT_FOUND') {
        return next(
          new AppError(
            'No analysis found for this resume yet',
            404,
            'ANALYSIS_NOT_FOUND',
          ),
        );
      }
      next(err);
    }
  }

  // GET /api/v1/resumes/:id/versions
  async listVersions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = getUserId(req);
      const resumeId = getParam(req, 'id');
      const versions = await resumeService.listVersions(userId, resumeId);

      res.status(200).json({
        success: true,
        data: { versions },
      });
    } catch (err: any) {
      if (err.message === 'RESUME_NOT_FOUND') {
        return next(new AppError('Resume not found', 404, 'NOT_FOUND'));
      }
      next(err);
    }
  }

  // GET /api/v1/resumes/:id/versions/:versionId
  async getVersion(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = getUserId(req);
      const resumeId = getParam(req, 'id');
      const versionId = getParam(req, 'versionId');
      const version = await resumeService.getVersion(
        userId,
        resumeId,
        versionId,
      );

      res.status(200).json({
        success: true,
        data: { version },
      });
    } catch (err: any) {
      if (
        err.message === 'RESUME_NOT_FOUND' ||
        err.message === 'VERSION_NOT_FOUND'
      ) {
        return next(new AppError('Version not found', 404, 'NOT_FOUND'));
      }
      next(err);
    }
  }
}

export const resumeController = new ResumeController();
