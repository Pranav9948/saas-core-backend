import { z } from 'zod';

const MemberBodySchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  dateOfBirth: z.coerce.date().optional(),
  assignedTrainerId: z.string().uuid().optional().nullable(),
});

export const CreateMemberSchema = z.object({ body: MemberBodySchema });

export const UpdateMemberSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: MemberBodySchema.partial(),
});

export const MemberIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
