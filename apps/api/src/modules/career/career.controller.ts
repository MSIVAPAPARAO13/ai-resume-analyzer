import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/error-handler.js';
import * as careerService from './career.service.js';

type AuthReq = Request & { user: { userId: string } };

function getUserId(req: Request): string {
  const userId = (req as AuthReq).user?.userId;
  if (!userId)
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  return userId;
}

function getParamId(req: Request): string {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

function handleOwnershipError(err: unknown, next: NextFunction): void {
  if (err instanceof Error) {
    if (err.message === 'NOT_FOUND') {
      return next(
        new AppError('Resource not found or access denied', 404, 'NOT_FOUND'),
      );
    }
    if (err.message === 'PROFILE_NOT_FOUND') {
      return next(
        new AppError('Career profile not found', 404, 'PROFILE_NOT_FOUND'),
      );
    }
  }
  next(err);
}

export class CareerController {
  // ─── Profile ───────────────────────────────────────────────────────────────

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const profile = await careerService.getProfile(userId);
      res.json({ success: true, data: { profile } });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const { headline, summary, targetRole, targetLevel, name, avatarUrl } =
        req.body;

      // Update CareerProfile
      await careerService.upsertProfile(userId, {
        headline,
        summary,
        targetRole,
        targetLevel,
      });

      // Update User display fields if provided
      if (name !== undefined || avatarUrl !== undefined) {
        await careerService.updateUserProfile(userId, { name, avatarUrl });
      }

      const profile = await careerService.getProfile(userId);
      res.json({ success: true, data: { profile } });
    } catch (err) {
      next(err);
    }
  }

  // ─── Experiences ───────────────────────────────────────────────────────────

  async getExperiences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const experiences = await careerService.getExperiences(userId);
      res.json({ success: true, data: { experiences } });
    } catch (err) {
      next(err);
    }
  }

  async createExperience(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const {
        company,
        title,
        employmentType,
        location,
        startDate,
        endDate,
        isCurrent,
        description,
      } = req.body;
      if (!company || !title || !startDate) {
        return next(
          new AppError(
            'company, title, and startDate are required',
            400,
            'VALIDATION_ERROR',
          ),
        );
      }
      const experience = await careerService.createExperience(userId, {
        company,
        title,
        employmentType,
        location,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        isCurrent,
        description,
      });
      res.status(201).json({ success: true, data: { experience } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  async updateExperience(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const id = getParamId(req);
      const data = { ...req.body };
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.endDate) data.endDate = new Date(data.endDate);
      const experience = await careerService.updateExperience(userId, id, data);
      res.json({ success: true, data: { experience } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  async deleteExperience(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      await careerService.deleteExperience(userId, getParamId(req));
      res.json({ success: true, data: { message: 'Experience deleted' } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  // ─── Education ─────────────────────────────────────────────────────────────

  async getEducation(req: Request, res: Response, next: NextFunction) {
    try {
      const education = await careerService.getEducation(getUserId(req));
      res.json({ success: true, data: { education } });
    } catch (err) {
      next(err);
    }
  }

  async createEducation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const {
        institution,
        degree,
        fieldOfStudy,
        startDate,
        endDate,
        isCurrent,
        grade,
        description,
      } = req.body;
      if (!institution || !startDate) {
        return next(
          new AppError(
            'institution and startDate are required',
            400,
            'VALIDATION_ERROR',
          ),
        );
      }
      const education = await careerService.createEducation(userId, {
        institution,
        degree,
        fieldOfStudy,
        grade,
        description,
        isCurrent,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
      });
      res.status(201).json({ success: true, data: { education } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  async updateEducation(req: Request, res: Response, next: NextFunction) {
    try {
      const education = await careerService.updateEducation(
        getUserId(req),
        getParamId(req),
        req.body,
      );
      res.json({ success: true, data: { education } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  async deleteEducation(req: Request, res: Response, next: NextFunction) {
    try {
      await careerService.deleteEducation(getUserId(req), getParamId(req));
      res.json({ success: true, data: { message: 'Education deleted' } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  // ─── Projects ──────────────────────────────────────────────────────────────

  async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await careerService.getProjects(getUserId(req));
      res.json({ success: true, data: { projects } });
    } catch (err) {
      next(err);
    }
  }

  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const {
        name,
        description,
        technologies,
        projectUrl,
        repoUrl,
        startDate,
        endDate,
      } = req.body;
      if (!name)
        return next(new AppError('name is required', 400, 'VALIDATION_ERROR'));
      const project = await careerService.createProject(userId, {
        name,
        description,
        technologies,
        projectUrl,
        repoUrl,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });
      res.status(201).json({ success: true, data: { project } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await careerService.updateProject(
        getUserId(req),
        getParamId(req),
        req.body,
      );
      res.json({ success: true, data: { project } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      await careerService.deleteProject(getUserId(req), getParamId(req));
      res.json({ success: true, data: { message: 'Project deleted' } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  // ─── Skills ────────────────────────────────────────────────────────────────

  async getSkills(req: Request, res: Response, next: NextFunction) {
    try {
      const skills = await careerService.getSkills(getUserId(req));
      res.json({ success: true, data: { skills } });
    } catch (err) {
      next(err);
    }
  }

  async createSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, category, proficiency } = req.body;
      if (!name)
        return next(new AppError('name is required', 400, 'VALIDATION_ERROR'));
      const skill = await careerService.createSkill(getUserId(req), {
        name,
        category,
        proficiency,
      });
      res.status(201).json({ success: true, data: { skill } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  async updateSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const skill = await careerService.updateSkill(
        getUserId(req),
        getParamId(req),
        req.body,
      );
      res.json({ success: true, data: { skill } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  async deleteSkill(req: Request, res: Response, next: NextFunction) {
    try {
      await careerService.deleteSkill(getUserId(req), getParamId(req));
      res.json({ success: true, data: { message: 'Skill deleted' } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  // ─── Certifications ────────────────────────────────────────────────────────

  async getCertifications(req: Request, res: Response, next: NextFunction) {
    try {
      const certifications = await careerService.getCertifications(
        getUserId(req),
      );
      res.json({ success: true, data: { certifications } });
    } catch (err) {
      next(err);
    }
  }

  async createCertification(req: Request, res: Response, next: NextFunction) {
    try {
      const certification = await careerService.createCertification(
        getUserId(req),
        req.body,
      );
      res.status(201).json({ success: true, data: { certification } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  async updateCertification(req: Request, res: Response, next: NextFunction) {
    try {
      const certification = await careerService.updateCertification(
        getUserId(req),
        getParamId(req),
        req.body,
      );
      res.json({ success: true, data: { certification } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  async deleteCertification(req: Request, res: Response, next: NextFunction) {
    try {
      await careerService.deleteCertification(getUserId(req), getParamId(req));
      res.json({ success: true, data: { message: 'Certification deleted' } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  // ─── Achievements ──────────────────────────────────────────────────────────

  async getAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const achievements = await careerService.getAchievements(getUserId(req));
      res.json({ success: true, data: { achievements } });
    } catch (err) {
      next(err);
    }
  }

  async createAchievement(req: Request, res: Response, next: NextFunction) {
    try {
      const achievement = await careerService.createAchievement(
        getUserId(req),
        req.body,
      );
      res.status(201).json({ success: true, data: { achievement } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  async updateAchievement(req: Request, res: Response, next: NextFunction) {
    try {
      const achievement = await careerService.updateAchievement(
        getUserId(req),
        getParamId(req),
        req.body,
      );
      res.json({ success: true, data: { achievement } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }

  async deleteAchievement(req: Request, res: Response, next: NextFunction) {
    try {
      await careerService.deleteAchievement(getUserId(req), getParamId(req));
      res.json({ success: true, data: { message: 'Achievement deleted' } });
    } catch (err) {
      handleOwnershipError(err, next);
    }
  }
}

export const careerController = new CareerController();
