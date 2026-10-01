import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export const authRouter = Router();

// Public routes
authRouter.post('/register', (req, res, next) => authController.register(req, res, next));
authRouter.post('/login', (req, res, next) => authController.login(req, res, next));
authRouter.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
authRouter.post('/logout', (req, res, next) => authController.logout(req, res, next));

// Protected routes
authRouter.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));
