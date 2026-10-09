import { Router } from 'express';
import { healthController } from './health.controller.js';

export const healthRouter = Router();

// Legacy health check (Phase 1 — kept for backward compat)
healthRouter.get('/health', (req, res) => healthController.getHealth(req, res));

// Liveness probe: server is alive (no dependency checks)
// Returns 200 immediately — used by load balancers to verify the process is running
healthRouter.get('/health/live', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'live' } });
});

// Readiness probe: server is ready to serve traffic
// Checks database + Redis connectivity — used during rolling deploys
healthRouter.get('/health/ready', (req, res) =>
  healthController.getReadiness(req, res),
);
