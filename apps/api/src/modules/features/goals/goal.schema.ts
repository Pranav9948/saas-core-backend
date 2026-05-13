import { z } from 'zod';

export const CreateGoalSchema = z.object({
  body: z.object({
    goalType: z.enum(['GAIN', 'LOSS']),
    currentWeight: z.number().positive(),
    targetWeight: z.number().positive(),
    durationWeeks: z.number().int().min(1).max(52),
    height: z.number().positive(),
  }),
});

export const MemberGoalParamSchema = z.object({
  params: z.object({
    memberId: z.string().uuid(),
  }),
});
