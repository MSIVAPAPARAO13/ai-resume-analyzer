import { Router } from 'express';
import { calendarController } from './calendar.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export const calendarRouter = Router();

// OAuth callback is called by Google redirection
calendarRouter.get('/callback', (req, res, next) =>
  calendarController.callback(req, res, next),
);

// Authenticated endpoints
calendarRouter.use(authenticate);
calendarRouter.get('/connect', calendarController.connect);
calendarRouter.get('/status', calendarController.getStatus);
calendarRouter.post('/disconnect', calendarController.disconnect);
