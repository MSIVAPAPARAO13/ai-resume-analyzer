import { Router } from 'express';
import { learningController } from './learning.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export const learningRouter = Router();

learningRouter.use(authenticate);

// Plans CRUD & actions
learningRouter.post('/', (req, res, next) =>
  learningController.createPlan(req, res, next),
);
learningRouter.get('/', (req, res, next) =>
  learningController.listPlans(req, res, next),
);
learningRouter.get('/:id', (req, res, next) =>
  learningController.getPlan(req, res, next),
);
learningRouter.patch('/:id', (req, res, next) =>
  learningController.updatePlan(req, res, next),
);
learningRouter.delete('/:id', (req, res, next) =>
  learningController.deletePlan(req, res, next),
);
learningRouter.post('/:id/generate', (req, res, next) =>
  learningController.generatePlan(req, res, next),
);
learningRouter.get('/:id/goals', (req, res, next) =>
  learningController.getGoals(req, res, next),
);
learningRouter.post('/:id/goals', (req, res, next) =>
  learningController.addGoal(req, res, next),
);
learningRouter.post('/:id/complete', (req, res, next) =>
  learningController.completePlan(req, res, next),
);

// Router for goals and tasks (/api/v1/learning-goals, /api/v1/learning-tasks)
export const learningEntityRouter = Router();
learningEntityRouter.use(authenticate);

learningEntityRouter.patch('/learning-goals/:id', (req, res, next) =>
  learningController.updateGoal(req, res, next),
);
learningEntityRouter.post('/learning-tasks', (req, res, next) =>
  learningController.addTask(req, res, next),
);
learningEntityRouter.patch('/learning-tasks/:id', (req, res, next) =>
  learningController.updateTask(req, res, next),
);
learningEntityRouter.delete('/learning-tasks/:id', (req, res, next) =>
  learningController.deleteTask(req, res, next),
);
