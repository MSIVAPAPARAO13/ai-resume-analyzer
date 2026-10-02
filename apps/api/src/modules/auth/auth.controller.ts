import type { Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginUser,
  issueTokenPair,
  refreshAccessToken,
  logoutUser,
  getUserById,
} from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from './auth.validation.js';
import { AppError } from '../../middleware/error-handler.js';

export class AuthController {
  // POST /api/v1/auth/register
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(
          new AppError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR'),
        );
      }

      const user = await registerUser(parsed.data);
      const tokens = await issueTokenPair(user);

      res.status(201).json({
        success: true,
        data: { user, ...tokens },
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
        return next(
          new AppError(
            'An account with this email already exists',
            409,
            'EMAIL_TAKEN',
          ),
        );
      }
      next(err);
    }
  }

  // POST /api/v1/auth/login
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(
          new AppError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR'),
        );
      }

      const user = await loginUser(parsed.data);
      const tokens = await issueTokenPair(user);

      res.status(200).json({
        success: true,
        data: { user, ...tokens },
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
        return next(
          new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'),
        );
      }
      next(err);
    }
  }

  // POST /api/v1/auth/refresh
  async refresh(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const parsed = refreshSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(
          new AppError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR'),
        );
      }

      const result = await refreshAccessToken(parsed.data.refreshToken);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_REFRESH_TOKEN') {
        return next(
          new AppError(
            'Refresh token is invalid or expired',
            401,
            'INVALID_REFRESH_TOKEN',
          ),
        );
      }
      next(err);
    }
  }

  // POST /api/v1/auth/logout
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = logoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(
          new AppError(parsed.error.errors[0].message, 400, 'VALIDATION_ERROR'),
        );
      }

      await logoutUser(parsed.data.refreshToken);

      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/auth/me (protected)
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return next(
          new AppError('Authentication required', 401, 'UNAUTHORIZED'),
        );
      }

      const user = await getUserById(userId);
      if (!user) {
        return next(new AppError('User not found', 404, 'NOT_FOUND'));
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
