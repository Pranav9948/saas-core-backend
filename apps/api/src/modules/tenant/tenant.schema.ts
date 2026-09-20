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
    name: z
      .string()
      .min(2, 'Gym name must be at least 2 characters')
      .max(100, 'Gym name cannot exceed 100 characters')
      .optional(),
    contactPhone: z
      .string()
      .min(8, 'Phone number must be at least 8 digits')
      .max(20, 'Phone number cannot exceed 20 digits')
      .regex(/^[0-9+\-() ]+$/, 'Invalid phone number format')
      .optional(),
    contactEmail: z.string().email('Invalid email format').optional(),
    address: z
      .string()
      .min(5, 'Address must be at least 5 characters')
      .max(255, 'Address is too long')
      .optional(),
    city: z
      .string()
      .min(2, 'City must be at least 2 characters')
      .max(100, 'City name is too long')
      .optional(),
    state: z
      .string()
      .min(2, 'State must be at least 2 characters')
      .max(100, 'State name is too long')
      .optional(),
    country: z
      .string()
      .min(2, 'Country must be at least 2 characters')
      .max(100, 'Country name is too long')
      .optional(),
    timezone: z.string().min(2, 'Timezone is invalid').max(100).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const InviteUserSchema = z.object({
  body: z.object({
    email: z
      .string({ error: 'Email is required' })
      .min(1, 'Email is required')
      .email('Invalid email format'),
    firstName: z
      .string({ error: 'First name is required' })
      .min(2, 'First name must be at least 2 characters'),
    lastName: z
      .string({ error: 'Last name is required' })
      .min(2, 'Last name must be at least 2 characters'),
    role: z.enum(['ADMIN', 'STAFF'], {
      error: 'Role must be ADMIN or STAFF',
    }),
  }),
});

export const directCreateUserSchema = z.object({
  body: z
    .object({
      email: z
        .string({ error: 'Email is required' })
        .min(1, 'Email is required')
        .email('Invalid email format'),
      firstName: z
        .string({ error: 'First name is required' })
        .min(2, 'First name must be at least 2 characters'),
      lastName: z
        .string({ error: 'Last name is required' })
        .min(1, 'Last name is required'),
      role: z.enum(['ADMIN', 'STAFF', 'TRAINER'], {
        error: 'Role must be ADMIN, STAFF, or TRAINER',
      }),
      password: passwordSchema,
      specialization: z
        .string()
        .min(3, 'Specialization must be at least 3 characters')
        .max(200, 'Specialization is too long')
        .optional(),
      bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.role === 'TRAINER' &&
        (!data.specialization || data.specialization.trim().length < 3)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['specialization'],
          message: 'Specialization is required for trainers (min 3 characters)',
        });
      }
    }),
});

export const AcceptInviteSchema = z.object({
  body: z.object({
    token: z.string().min(10, 'Invite token is invalid'),
    password: passwordSchema,
  }),
});

export const InvitePreviewQuerySchema = z.object({
  query: z.object({
    token: z.string().min(10, 'Invite token is invalid'),
  }),
});

export const InviteIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid invite ID'),
  }),
});

export const upgradePlanSchema = z.object({
  body: z.object({
    planName: z.enum(['BASIC', 'PRO'], {
      error: 'Plan name must be BASIC or PRO',
    }),
    interval: z.enum(['MONTHLY', 'YEARLY'], {
      error: 'Billing interval must be MONTHLY or YEARLY',
    }),
  }),
});
