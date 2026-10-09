import { Router } from 'express';
import { interviewController } from './interview.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export const interviewRouter = Router();

interviewRouter.use(authenticate);

// Sessions CRUD
interviewRouter.post('/', interviewController.createSession);
interviewRouter.get('/', interviewController.listSessions);
interviewRouter.get('/:id', interviewController.getSession);
interviewRouter.patch('/:id', interviewController.updateSession);
interviewRouter.delete('/:id', interviewController.deleteSession);

// Question generation & listing
interviewRouter.post(
  '/:id/generate-questions',
  interviewController.generateQuestions,
);
interviewRouter.get('/:id/questions', interviewController.listQuestions);

// Answer submission, listing & AI evaluation
interviewRouter.post(
  '/:id/questions/:questionId/answer',
  interviewController.submitAnswer,
);
interviewRouter.get(
  '/:id/questions/:questionId/answers',
  interviewController.listAnswers,
);
interviewRouter.post(
  '/:id/questions/:questionId/evaluate',
  interviewController.evaluateAnswer,
);

// Preparation Plan
interviewRouter.get('/:id/prep-plan', interviewController.getPrepPlan);

// Session completion & Final Report
interviewRouter.post('/:id/complete', interviewController.completeSession);
interviewRouter.get('/:id/report', interviewController.getFinalReport);

// Calendar Event
interviewRouter.post(
  '/:id/calendar-event',
  interviewController.addCalendarEvent,
);
