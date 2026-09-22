import { z } from 'zod';

export const StaffAttendanceQuerySchema = z.object({
  query: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD').optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD').optional(),
    range: z.enum(['this_month', 'last_month', 'custom']).optional(),
  }),
});

export const MarkStaffAttendanceSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
    present: z.boolean().default(true),
    notes: z.string().trim().max(200).optional(),
  }),
});

export const ListStaffAttendanceQuerySchema = z.object({
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  }),
});

export const TrainerPerformanceQuerySchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid trainer ID') }),
  query: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    range: z.enum(['this_month', 'last_month', 'custom']).optional(),
  }),
});
