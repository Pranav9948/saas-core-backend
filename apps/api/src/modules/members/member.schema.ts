import { z } from 'zod';

const MemberBodySchema = z.object({
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
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number format')
    .optional(),
  dateOfBirth: z.coerce.date({ error: 'Invalid date of birth' }).optional(),
  assignedTrainerId: z
    .string()
    .uuid('Invalid trainer ID')
    .optional()
    .nullable(),
  packageId: z.string().uuid('Invalid package ID'),
  paymentStatus: z.enum(['PAID', 'PENDING']).optional(),
});

export const CreateMemberSchema = z.object({ body: MemberBodySchema });

export const UpdateMemberSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid member ID') }),
  body: MemberBodySchema.partial(),
});

export const MemberIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid member ID') }),
});

export const ListMembersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    packageId: z.string().uuid('Invalid package ID').optional(),
    paymentStatus: z
      .enum(['PAID', 'PENDING', 'OVERDUE', 'UNPAID'])
      .optional(),
    expirationWindow: z
      .enum(['expiring_7', 'expiring_today', 'expired'])
      .optional(),
    search: z.string().trim().max(80).optional(),
  }),
});
