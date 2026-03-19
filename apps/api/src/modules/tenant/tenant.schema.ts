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
  name: z.string().min(2).optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().optional(),
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
    lastName: z.string().min(2),
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
