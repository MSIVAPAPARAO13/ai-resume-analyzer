import type { Request, Response, NextFunction } from 'express';
import { gitHubService } from './github.service.js';
import { AppError } from '../../middleware/error-handler.js';
import { env } from '../../config/env.js';

function getUserId(req: Request): string {
  const user = (req as any).user;
  const userId = user?.userId || user?.id;
  if (!userId) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  return userId;
}

export class GitHubController {
  async connect(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const data = gitHubService.getConnectUrl(userId);
      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async callback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state } = req.query;
      if (!code || typeof code !== 'string') {
        throw new AppError('Missing authorization code', 400, 'BAD_REQUEST');
      }
      if (!state || typeof state !== 'string') {
        throw new AppError('Missing OAuth state parameter', 400, 'BAD_REQUEST');
      }

      // Check if user is authenticated via cookie/token or extract from state
      const currentUserId = (req as any).user?.userId || (req as any).user?.id;
      const result = await gitHubService.handleCallback(
        code,
        state,
        currentUserId,
      );

      // If user agent accepts HTML, redirect back to frontend
      const acceptHeader = req.headers.accept || '';
      if (acceptHeader.includes('text/html')) {
        return res.redirect(
          `${env.FRONTEND_URL}/integrations/github?connected=true&username=${encodeURIComponent(result.username)}`,
        );
      }

      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const status = await gitHubService.getConnectionStatus(userId);
      return res.json({
        success: true,
        data: status,
      });
    } catch (err) {
      next(err);
    }
  }

  async disconnect(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      await gitHubService.disconnect(userId);
      return res.json({
        success: true,
        data: { message: 'GitHub account disconnected successfully' },
      });
    } catch (err) {
      next(err);
    }
  }

  async getRepositories(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const refresh = req.query.refresh === 'true';
      const repos = await gitHubService.getRepositories(userId, refresh);
      return res.json({
        success: true,
        data: repos,
      });
    } catch (err) {
      next(err);
    }
  }

  async getRepository(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;
      const repo = await gitHubService.getRepository(userId, id);
      return res.json({
        success: true,
        data: repo,
      });
    } catch (err) {
      next(err);
    }
  }

  async getLanguages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;
      const languages = await gitHubService.getRepositoryLanguages(userId, id);
      return res.json({
        success: true,
        data: languages,
      });
    } catch (err) {
      next(err);
    }
  }

  async getReadme(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;
      const readme = await gitHubService.getRepositoryReadme(userId, id);
      return res.json({
        success: true,
        data: readme,
      });
    } catch (err) {
      next(err);
    }
  }

  async importToCareerTwin(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = req.params.id as string;
      const projectData = req.body;
      const result = await gitHubService.importToCareerTwin(
        userId,
        id,
        projectData,
      );
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const evidence = await gitHubService.getEvidence(userId);
      return res.json({
        success: true,
        data: evidence,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const gitHubController = new GitHubController();
