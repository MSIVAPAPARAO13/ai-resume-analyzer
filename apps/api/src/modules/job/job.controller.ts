import { Request, Response, NextFunction } from 'express';
import { JobService } from './job.service.js';
import { createJobSchema, updateJobSchema } from './job.validation.js';

export class JobController {
  private jobService: JobService;

  constructor() {
    this.jobService = new JobService();
  }

  // ─── 1. Job CRUD ─────────────────────────────────────────────────────────────

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const validated = createJobSchema.parse(req.body);

      const job = await this.jobService.createJob(userId, validated);

      res.status(201).json({
        success: true,
        data: job,
      });
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const page = req.query.page
        ? parseInt(req.query.page as string, 10)
        : undefined;
      const pageSize = req.query.pageSize
        ? parseInt(req.query.pageSize as string, 10)
        : undefined;
      const jobs = await this.jobService.listJobs(userId, { page, pageSize });

      res.status(200).json({
        success: true,
        data: jobs,
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const jobId = req.params.id as string;

      const job = await this.jobService.getJobById(userId, jobId);

      res.status(200).json({
        success: true,
        data: job,
      });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const jobId = req.params.id as string;
      const validated = updateJobSchema.parse(req.body);

      const updated = await this.jobService.updateJob(userId, jobId, validated);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const jobId = req.params.id as string;

      const result = await this.jobService.deleteJob(userId, jobId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  // ─── 2. Job Analysis ─────────────────────────────────────────────────────────

  analyze = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const jobId = req.params.id as string;

      const analyzed = await this.jobService.analyzeJob(userId, jobId);

      res.status(200).json({
        success: true,
        data: analyzed,
      });
    } catch (err) {
      next(err);
    }
  };

  getAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const jobId = req.params.id as string;

      const analysis = await this.jobService.getJobAnalysis(userId, jobId);

      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (err) {
      next(err);
    }
  };

  // ─── 3. Resume ↔ Job Matching ───────────────────────────────────────────────

  matchResume = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const jobId = req.params.jobId as string;
      const resumeId = req.params.resumeId as string;

      const match = await this.jobService.matchResume(userId, jobId, resumeId);

      res.status(201).json({
        success: true,
        data: match,
      });
    } catch (err) {
      next(err);
    }
  };

  getMatches = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const jobId = req.params.jobId as string;

      const matches = await this.jobService.getJobMatches(userId, jobId);

      res.status(200).json({
        success: true,
        data: matches,
      });
    } catch (err) {
      next(err);
    }
  };

  getMatchById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const jobId = req.params.jobId as string;
      const matchId = req.params.matchId as string;

      const match = await this.jobService.getJobMatchById(
        userId,
        jobId,
        matchId,
      );

      res.status(200).json({
        success: true,
        data: match,
      });
    } catch (err) {
      next(err);
    }
  };
}
