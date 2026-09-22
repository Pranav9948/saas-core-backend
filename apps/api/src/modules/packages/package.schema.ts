import { z } from 'zod';
import {
  LIMITED_PACKAGE_FEATURES,
  PACKAGE_FEATURE_IDS,
} from './package.features.js';

const FeatureLimitsSchema = z.preprocess((value) => {
  if (value == null) {
    return {};
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const cleaned: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (
      !LIMITED_PACKAGE_FEATURES.includes(
        key as (typeof LIMITED_PACKAGE_FEATURES)[number],
      )
    ) {
      continue;
    }
    const times = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isFinite(times) && Number.isInteger(times) && times >= 1 && times <= 31) {
      cleaned[key] = times;
    }
  }
  return cleaned;
}, z.record(z.string(), z.number().int().min(1).max(31)));

const PackageBodySchema = z.object({
  name: z
    .string({ error: 'Package name is required' })
    .trim()
    .min(2, 'Package name must be at least 2 characters')
    .max(80, 'Package name must be at most 80 characters'),
  description: z
    .string()
    .trim()
    .max(300, 'Description must be at most 300 characters')
    .optional()
    .or(z.literal('')),
  durationDays: z.coerce
    .number({ error: 'Duration is required' })
    .int('Duration must be a whole number of days')
    .min(1, 'Duration must be at least 1 day')
    .max(3650, 'Duration cannot exceed 3650 days'),
  price: z.coerce
    .number({ error: 'Price is required' })
    .int('Price must be a whole number')
    .min(0, 'Price cannot be negative'),
  currency: z.string().trim().min(3).max(8).optional(),
  features: z
    .array(z.enum(PACKAGE_FEATURE_IDS))
    .max(PACKAGE_FEATURE_IDS.length)
    .optional(),
  featureLimits: FeatureLimitsSchema.optional(),
});

export const CreatePackageSchema = z.object({ body: PackageBodySchema });

export const UpdatePackageSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid package ID') }),
  body: PackageBodySchema.partial().extend({
    isActive: z.boolean().optional(),
  }),
});

export const PackageIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid package ID') }),
});
