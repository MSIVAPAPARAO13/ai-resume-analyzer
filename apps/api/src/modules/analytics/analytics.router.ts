import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export const analyticsRouter = Router();

// All analytics endpoints require authentication
analyticsRouter.use(authenticate);

analyticsRouter.get('/overview', (req, res, next) =>
  analyticsController.getOverview(req, res, next),
);
analyticsRouter.get('/skills/gaps', (req, res, next) =>
  analyticsController.getSkillGaps(req, res, next),
);
analyticsRouter.get('/skills/:skill', (req, res, next) =>
  analyticsController.getSkillDetail(req, res, next),
);
analyticsRouter.get('/skills', (req, res, next) =>
  analyticsController.getSkills(req, res, next),
);
analyticsRouter.get('/roles', (req, res, next) =>
  analyticsController.getRoles(req, res, next),
);
analyticsRouter.get('/jobs', (req, res, next) =>
  analyticsController.getJobs(req, res, next),
);
analyticsRouter.get('/applications', (req, res, next) =>
  analyticsController.getApplications(req, res, next),
);
analyticsRouter.get('/interviews', (req, res, next) =>
  analyticsController.getInterviews(req, res, next),
);
analyticsRouter.get('/resumes', (req, res, next) =>
  analyticsController.getResumes(req, res, next),
);
analyticsRouter.get('/evidence', (req, res, next) =>
  analyticsController.getEvidence(req, res, next),
);
analyticsRouter.get('/progress', (req, res, next) =>
  analyticsController.getProgress(req, res, next),
);
analyticsRouter.post('/snapshot', (req, res, next) =>
  analyticsController.createSnapshot(req, res, next),
);
