import { z } from 'zod';

export const MarkAttendanceSchema = z.object({
  body: z.object({
    memberId: z.string().uuid('Invalid Member ID'),
    deviceInfo: z.string().optional(),
  }),
});

export const GetAttendanceByDateSchema = z.object({
  query: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  }),
});

export const MemberStatsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid Member ID'),
  }),
});
