import { Router } from 'express';
import multer from 'multer';
import { resumeController } from './resume.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { AppError } from '../../middleware/error-handler.js';

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const lower = file.originalname.toLowerCase();
    const isPdf = file.mimetype === 'application/pdf' || lower.endsWith('.pdf');
    const isDocx =
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword' ||
      lower.endsWith('.docx');

    if (isPdf || isDocx) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          'Only PDF and DOCX files are allowed',
          400,
          'INVALID_FILE_TYPE',
        ) as any,
        false,
      );
    }
  },
});

export const resumeRouter = Router();

// Enforce authentication on all resume endpoints
resumeRouter.use(authenticate);

// Resume CRUD
resumeRouter.get('/resumes', resumeController.list);
resumeRouter.post('/resumes', upload.single('file'), resumeController.upload);
resumeRouter.get('/resumes/:id', resumeController.getOne);
resumeRouter.delete('/resumes/:id', resumeController.delete);

// Resume Analysis
resumeRouter.post('/resumes/:id/analyze', resumeController.analyze);
resumeRouter.get('/resumes/:id/analysis', resumeController.getAnalysis);

// Resume Versioning
resumeRouter.get('/resumes/:id/versions', resumeController.listVersions);
resumeRouter.get(
  '/resumes/:id/versions/:versionId',
  resumeController.getVersion,
);
