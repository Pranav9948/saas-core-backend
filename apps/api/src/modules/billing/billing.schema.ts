import { z } from 'zod';

export const CreateCheckoutSessionSchema = z.object({
  body: z.object({
    planId: z.string().uuid('Invalid plan ID'),
  }),
});

export const PaymentHistoryQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    starting_after: z.string().min(1).optional(),
  }),
});
