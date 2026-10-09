import { z } from 'zod';

export const ApplicationStatusEnum = z.enum([
  'SAVED',
  'APPLIED',
  'ASSESSMENT',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
]);

export const ApplicationEventTypeEnum = z.enum([
  'CREATED',
  'APPLIED',
  'ASSESSMENT',
  'INTERVIEW',
  'FOLLOW_UP',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
  'NOTE',
]);

export const createApplicationSchema = z.object({
  jobId: z.string().uuid().optional().nullable(),
  resumeVersionId: z.string().uuid().optional().nullable(),
  tailoringSessionId: z.string().uuid().optional().nullable(),
  company: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role title is required'),
  jobUrl: z.string().url().optional().or(z.literal('')).nullable(),
  status: ApplicationStatusEnum.default('SAVED'),
  appliedAt: z.string().datetime().optional().nullable(),
  followUpAt: z.string().datetime().optional().nullable(),
  recruiterName: z.string().optional().nullable(),
  recruiterEmail: z.string().email().optional().or(z.literal('')).nullable(),
  notes: z.string().optional().nullable(),
});

export const updateApplicationSchema = z.object({
  jobId: z.string().uuid().optional().nullable(),
  resumeVersionId: z.string().uuid().optional().nullable(),
  tailoringSessionId: z.string().uuid().optional().nullable(),
  company: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  jobUrl: z.string().url().optional().or(z.literal('')).nullable(),
  status: ApplicationStatusEnum.optional(),
  appliedAt: z.string().datetime().optional().nullable(),
  followUpAt: z.string().datetime().optional().nullable(),
  recruiterName: z.string().optional().nullable(),
  recruiterEmail: z.string().email().optional().or(z.literal('')).nullable(),
  notes: z.string().optional().nullable(),
});

export const updateApplicationStatusSchema = z.object({
  status: ApplicationStatusEnum,
  notes: z.string().optional().nullable(),
  eventDate: z.string().datetime().optional().nullable(),
});

export const createApplicationEventSchema = z.object({
  type: ApplicationEventTypeEnum,
  description: z.string().min(1, 'Description is required'),
  eventDate: z.string().datetime().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
});
