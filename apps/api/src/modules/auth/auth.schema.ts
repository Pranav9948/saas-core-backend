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

export const RegisterGymSchema = z.object({
  body: z.object({
    gymName: z
      .string({ error: 'Gym name is required' })
      .trim()
      .min(2, 'Gym name must be at least 2 characters')
      .max(100, 'Gym name cannot exceed 100 characters'),

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

    contactPhone: z
      .string({ error: 'Phone number is required' })
      .trim()
      .min(8, 'Phone number must be at least 8 digits')
      .max(15, 'Phone number cannot exceed 15 digits')
      .regex(/^[0-9+\-() ]+$/, 'Invalid phone number format'),

    contactEmail: z
      .string({ error: 'Gym contact email is required' })
      .trim()
      .email('Invalid email format')
      .toLowerCase(),

    address: z
      .string({ error: 'Address is required' })
      .trim()
      .min(5, 'Address must be at least 5 characters')
      .max(255, 'Address too long'),

    city: z
      .string({ error: 'City is required' })
      .trim()
      .min(2, 'City must be at least 2 characters')
      .max(100, 'City name too long'),

    country: z
      .string({ error: 'Country is required' })
      .trim()
      .min(2, 'Country must be at least 2 characters')
      .max(100, 'Country name too long'),

    timezone: z.string().trim().min(2).max(100).optional(),
  }),
});

export const SignupSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: passwordSchema,
    firstName: z.string().min(2, 'First name is too short'),
    lastName: z.string().min(2, 'Last name is too short'),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const ForgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

export const ResetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string().min(1, 'Token is required'),
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});
