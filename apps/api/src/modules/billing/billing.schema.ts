import { z } from 'zod';

export const CreateCheckoutSessionSchema = z.object({
  body: z.object({
    planId: z.string().uuid('Invalid plan ID'),
  }),
});
