import { z } from 'zod';

export const createResumeSchema = z.object({
  title: z.string().min(1).max(150).optional(),
});

export const resumeIdParamSchema = z.object({
  id: z.string().uuid('Invalid resume ID format'),
});

export const versionIdParamSchema = z.object({
  id: z.string().uuid('Invalid resume ID format'),
  versionId: z.string().uuid('Invalid version ID format'),
});
