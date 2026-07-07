import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
  .refine((val) => !val.includes(' '), {
    message: 'Password must not contain spaces',
  });

export const superAdminCreationSchema = z.object({
  body: z.object({
    firstName: z
      .string({ error: 'first Name of admin is required' })
      .trim()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name cannot exceed 50 characters'),

    lastName: z
      .string({ error: 'last Name of admin is required' })
      .trim()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name cannot exceed 50 characters'),

    email: z
      .string({ error: 'email is required' })
      .trim()
      .email('Invalid email format')
      .toLowerCase(),

    password: passwordSchema,
  }),
});

export const superAdminLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const CreatePlanSchema = z.object({
  body: z.object({
    name: z.enum(['FREE', 'BASIC', 'PRO']),
    price: z.number().min(0),
    currency: z.string(),
    interval: z.enum(['MONTHLY', 'YEARLY']),
    stripePriceId: z.string().optional(),
    features: z.record(z.string(), z.any()),
  }),
});

export const UpdatePlanSchema = z.object({
  body: z
    .object({
      name: z.enum(['FREE', 'BASIC', 'PRO']),
      price: z.number().min(0),
      currency: z.string(),
      interval: z.enum(['MONTHLY', 'YEARLY']),
      stripePriceId: z.string().optional(),
      features: z.record(z.string(), z.any()),
    })
    .partial(),
});

export const PlanIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
