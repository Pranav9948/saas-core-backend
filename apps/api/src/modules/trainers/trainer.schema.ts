import { z } from 'zod';

const CreateTrainerBodySchema = z.object({
  userId: z.string().uuid('Invalid User ID'),
  specialization: z.string().min(3, 'Specialization is required'),
  bio: z.string().max(500, 'Bio is too long').optional(),
});

const UpdateTrainerBodySchema = CreateTrainerBodySchema.omit({
  userId: true,
}).partial();

export const CreateTrainerSchema = z.object({
  body: CreateTrainerBodySchema,
});

export const UpdateTrainerSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: UpdateTrainerBodySchema,
});

export const GetTrainerIDSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
