import { Router } from 'express';
import { healthController } from './health.controller.js';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => healthController.getHealth(req, res));
