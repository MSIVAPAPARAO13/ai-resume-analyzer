import { Router } from 'express';
import { applicationController } from './application.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// All application routes require authentication
router.use(authenticate);

// Analytics endpoint
router.get('/analytics', (req, res, next) =>
  applicationController.getAnalytics(req, res, next),
);

// List & Create
router.get('/', (req, res, next) =>
  applicationController.getApplications(req, res, next),
);
router.post('/', (req, res, next) =>
  applicationController.createApplication(req, res, next),
);

// Detail, Update, Delete
router.get('/:id', (req, res, next) =>
  applicationController.getApplicationById(req, res, next),
);
router.put('/:id', (req, res, next) =>
  applicationController.updateApplication(req, res, next),
);
router.delete('/:id', (req, res, next) =>
  applicationController.deleteApplication(req, res, next),
);

// Status Patch
router.patch('/:id/status', (req, res, next) =>
  applicationController.updateStatus(req, res, next),
);

// Events
router.get('/:id/events', (req, res, next) =>
  applicationController.getEvents(req, res, next),
);
router.post('/:id/events', (req, res, next) =>
  applicationController.createEvent(req, res, next),
);

export const applicationRouter = router;
