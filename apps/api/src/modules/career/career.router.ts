import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { careerController } from './career.controller.js';

export const careerRouter = Router();

// All career routes are protected
careerRouter.use(authenticate);

// ─── Profile ─────────────────────────────────────────────────────────────────
careerRouter.get('/profile', (req, res, next) => careerController.getProfile(req, res, next));
careerRouter.put('/profile', (req, res, next) => careerController.updateProfile(req, res, next));

// ─── Experiences ──────────────────────────────────────────────────────────────
careerRouter.get('/experiences', (req, res, next) => careerController.getExperiences(req, res, next));
careerRouter.post('/experiences', (req, res, next) => careerController.createExperience(req, res, next));
careerRouter.put('/experiences/:id', (req, res, next) => careerController.updateExperience(req, res, next));
careerRouter.delete('/experiences/:id', (req, res, next) => careerController.deleteExperience(req, res, next));

// ─── Education ────────────────────────────────────────────────────────────────
careerRouter.get('/education', (req, res, next) => careerController.getEducation(req, res, next));
careerRouter.post('/education', (req, res, next) => careerController.createEducation(req, res, next));
careerRouter.put('/education/:id', (req, res, next) => careerController.updateEducation(req, res, next));
careerRouter.delete('/education/:id', (req, res, next) => careerController.deleteEducation(req, res, next));

// ─── Projects ─────────────────────────────────────────────────────────────────
careerRouter.get('/projects', (req, res, next) => careerController.getProjects(req, res, next));
careerRouter.post('/projects', (req, res, next) => careerController.createProject(req, res, next));
careerRouter.put('/projects/:id', (req, res, next) => careerController.updateProject(req, res, next));
careerRouter.delete('/projects/:id', (req, res, next) => careerController.deleteProject(req, res, next));

// ─── Skills ───────────────────────────────────────────────────────────────────
careerRouter.get('/skills', (req, res, next) => careerController.getSkills(req, res, next));
careerRouter.post('/skills', (req, res, next) => careerController.createSkill(req, res, next));
careerRouter.put('/skills/:id', (req, res, next) => careerController.updateSkill(req, res, next));
careerRouter.delete('/skills/:id', (req, res, next) => careerController.deleteSkill(req, res, next));

// ─── Certifications ───────────────────────────────────────────────────────────
careerRouter.get('/certifications', (req, res, next) => careerController.getCertifications(req, res, next));
careerRouter.post('/certifications', (req, res, next) => careerController.createCertification(req, res, next));
careerRouter.put('/certifications/:id', (req, res, next) => careerController.updateCertification(req, res, next));
careerRouter.delete('/certifications/:id', (req, res, next) => careerController.deleteCertification(req, res, next));

// ─── Achievements ─────────────────────────────────────────────────────────────
careerRouter.get('/achievements', (req, res, next) => careerController.getAchievements(req, res, next));
careerRouter.post('/achievements', (req, res, next) => careerController.createAchievement(req, res, next));
careerRouter.put('/achievements/:id', (req, res, next) => careerController.updateAchievement(req, res, next));
careerRouter.delete('/achievements/:id', (req, res, next) => careerController.deleteAchievement(req, res, next));
