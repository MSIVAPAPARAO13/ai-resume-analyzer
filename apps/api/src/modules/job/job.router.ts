import { Router } from 'express';
import { JobController } from './job.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();
const controller = new JobController();

// All Job routes require authentication
router.use(authenticate);

// 1. Job CRUD
router.post('/', controller.create);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// 2. Job Analysis
router.post('/:id/analyze', controller.analyze);
router.get('/:id/analysis', controller.getAnalysis);

// 3. Resume ↔ Job Matching
router.post('/:jobId/match/:resumeId', controller.matchResume);
router.get('/:jobId/matches', controller.getMatches);
router.get('/:jobId/matches/:matchId', controller.getMatchById);

export { router as jobRouter };
