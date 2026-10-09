import { z } from 'zod';

export const createInterviewSessionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  mode: z.enum(['PREPARATION', 'MOCK_INTERVIEW']).default('PREPARATION'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  applicationId: z.string().uuid().optional().nullable(),
  jobId: z.string().uuid().optional().nullable(),
  resumeVersionId: z.string().uuid().optional().nullable(),
  tailoringSessionId: z.string().uuid().optional().nullable(),
});

export const updateInterviewSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  mode: z.enum(['PREPARATION', 'MOCK_INTERVIEW']).optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED']).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const generateQuestionsSchema = z.object({
  questionCount: z.number().int().min(1).max(25).default(10),
  categories: z
    .array(
      z.enum([
        'RESUME',
        'CAREER_TWIN',
        'PROJECT',
        'TECHNICAL',
        'JOB_SPECIFIC',
        'BEHAVIORAL',
        'SITUATIONAL',
        'COMPANY_ROLE',
        'EXPERIENCE',
      ]),
    )
    .optional(),
  targetRole: z.string().optional(),
  targetCompany: z.string().optional(),
});

export const submitAnswerSchema = z.object({
  answerText: z.string().min(1, 'Answer text cannot be empty').max(10000),
  isDraft: z.boolean().default(false),
});

export const scheduleCalendarEventSchema = z.object({
  summary: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  startTime: z
    .string()
    .datetime({ message: 'Valid ISO datetime required for startTime' }),
  endTime: z
    .string()
    .datetime({ message: 'Valid ISO datetime required for endTime' }),
  timeZone: z.string().default('UTC'),
  includeNotes: z.boolean().default(false),
});

export const createReminderSchema = z.object({
  remindAt: z
    .string()
    .datetime({ message: 'Valid ISO datetime required for remindAt' }),
  type: z.enum(['EMAIL', 'CALENDAR', 'BOTH']).default('EMAIL'),
});
