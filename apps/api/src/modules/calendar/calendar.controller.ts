import type { Request, Response, NextFunction } from 'express';
import { calendarService } from './calendar.service.js';
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

export class CalendarController {
  async connect(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const url = calendarService.getConnectUrl(userId);
      return res.json({
        success: true,
        data: { url },
      });
    } catch (err) {
      next(err);
    }
  }

  async callback(req: Request, res: Response, _next: NextFunction) {
    try {
      const { code, state } = req.query;
      if (
        !code ||
        !state ||
        typeof code !== 'string' ||
        typeof state !== 'string'
      ) {
        throw new AppError('Missing code or state parameter', 400);
      }

      await calendarService.handleCallback(code, state);

      // Redirect to frontend integration page
      const redirectUrl = `${env.FRONTEND_URL}/integrations/google-calendar?status=success`;
      return res.redirect(redirectUrl);
    } catch (err: any) {
      const errorMsg = encodeURIComponent(
        err.message || 'OAuth callback failed',
      );
      return res.redirect(
        `${env.FRONTEND_URL}/integrations/google-calendar?status=error&message=${errorMsg}`,
      );
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const status = await calendarService.getStatus(userId);
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
      await calendarService.disconnect(userId);
      return res.json({
        success: true,
        data: { message: 'Google Calendar disconnected successfully' },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const calendarController = new CalendarController();
