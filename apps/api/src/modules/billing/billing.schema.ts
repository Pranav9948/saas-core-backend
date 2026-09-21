import { z } from 'zod';

export const CreateCheckoutSessionSchema = z.object({
  body: z
    .object({
      planId: z.string().uuid('Invalid plan ID').optional(),
      priceId: z.string().min(1, 'priceId is required').optional(),
    })
    .refine((data) => Boolean(data.planId || data.priceId), {
      message: 'planId or priceId is required',
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
