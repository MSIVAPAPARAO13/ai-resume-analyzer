import { Router } from 'express';
import { gitHubController } from './github.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// OAuth callback: state contains signed user ID so it can be handled directly on redirect
router.get('/callback', (req, res, next) =>
  gitHubController.callback(req, res, next),
);

// All other GitHub routes require authentication
router.use(authenticate);

// Connection & Profile
router.get('/connect', (req, res, next) =>
  gitHubController.connect(req, res, next),
);
router.post('/disconnect', (req, res, next) =>
  gitHubController.disconnect(req, res, next),
);
router.get('/me', (req, res, next) => gitHubController.getMe(req, res, next));
router.get('/evidence', (req, res, next) =>
  gitHubController.getEvidence(req, res, next),
);

// Repositories
router.get('/repositories', (req, res, next) =>
  gitHubController.getRepositories(req, res, next),
);
router.get('/repositories/:id', (req, res, next) =>
  gitHubController.getRepository(req, res, next),
);
router.get('/repositories/:id/languages', (req, res, next) =>
  gitHubController.getLanguages(req, res, next),
);
router.get('/repositories/:id/readme', (req, res, next) =>
  gitHubController.getReadme(req, res, next),
);
router.post('/repositories/:id/import', (req, res, next) =>
  gitHubController.importToCareerTwin(req, res, next),
);

export const githubRouter = router;
