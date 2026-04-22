import { z } from 'zod';

export const CreateCheckoutSessionSchema = z.object({
  body: z.object({
    plan: z.enum(['BASIC', 'PRO']),
    interval: z.enum(['MONTHLY', 'YEARLY']),
  }),
});
