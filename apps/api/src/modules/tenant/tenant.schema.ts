import { z } from 'zod';

export const UpdateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().optional(),
});
