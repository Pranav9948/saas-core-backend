import { z } from 'zod';

export const CreateCheckoutSessionSchema = z.object({
  body: z.object({
    planId: z.string().uuid('Invalid plan ID'),
  }),
});

export const PaymentHistoryQuerySchema = z.object({
  query: z.object({
    limit: z.coerce
      .number({ error: 'Limit must be a number' })
      .int('Limit must be a whole number')
      .min(1, 'Limit must be at least 1')
      .max(100, 'Limit cannot exceed 100')
      .optional(),
    starting_after: z.string().min(1).optional(),
  }),
});
