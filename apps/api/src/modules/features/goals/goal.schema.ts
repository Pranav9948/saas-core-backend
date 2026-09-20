import { z } from 'zod';

export const CreateGoalSchema = z.object({
  body: z.object({
    goalType: z.enum(['GAIN', 'LOSS'], {
      error: 'Goal type must be GAIN or LOSS',
    }),
    currentWeight: z
      .number({ error: 'Current weight is required' })
      .positive('Current weight must be greater than 0'),
    targetWeight: z
      .number({ error: 'Target weight is required' })
      .positive('Target weight must be greater than 0'),
    durationWeeks: z
      .number({ error: 'Duration is required' })
      .int('Duration must be a whole number of weeks')
      .min(1, 'Duration must be at least 1 week')
      .max(52, 'Duration cannot exceed 52 weeks'),
    height: z
      .number({ error: 'Height is required' })
      .positive('Height must be greater than 0'),
  }),
});

export const MemberGoalParamSchema = z.object({
  params: z.object({
    memberId: z.string().uuid('Invalid member ID'),
  }),
});
