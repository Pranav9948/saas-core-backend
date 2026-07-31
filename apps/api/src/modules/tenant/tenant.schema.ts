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

export const UpdateTenantSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    contactPhone: z
      .string()
      .min(8)
      .max(20)
      .regex(/^[0-9+\-() ]+$/, 'Phone number contains invalid characters')
      .optional(),
    contactEmail: z.string().email().optional(),
    address: z.string().min(5).max(255).optional(),
    city: z.string().min(2).max(100).optional(),
    state: z.string().min(2).max(100).optional(),
    country: z.string().min(2).max(100).optional(),
    timezone: z.string().min(2).max(100).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const InviteUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    role: z.enum(['ADMIN', 'STAFF']),
  }),
});

export const directCreateUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    firstName: z.string().min(2),
    lastName: z.string().min(1),
    role: z.enum(['ADMIN', 'STAFF']),
    password: passwordSchema,
  }),
});

export const AcceptInviteSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    password: passwordSchema,
  }),
});

export const InvitePreviewQuerySchema = z.object({
  query: z.object({
    token: z.string().min(10),
  }),
});

export const InviteIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const upgradePlanSchema = z.object({
  body: z.object({
    planName: z.enum(['BASIC', 'PRO']),
    interval: z.enum(['MONTHLY', 'YEARLY']),
  }),
});
