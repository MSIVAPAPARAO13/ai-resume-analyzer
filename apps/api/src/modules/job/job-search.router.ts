import { Router } from 'express';
import { jobSearchController } from './job-search.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export const jobSearchRouter = Router();

// Enforce authentication on all job search & import endpoints
jobSearchRouter.use(authenticate);

jobSearchRouter.get('/job-search', jobSearchController.searchJobs);
jobSearchRouter.post('/job-search/import', jobSearchController.importJob);
jobSearchRouter.get(
  '/job-search/salary-estimate',
  jobSearchController.getSalaryEstimate,
);
