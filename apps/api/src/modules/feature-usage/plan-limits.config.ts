import type { PlanName } from '@/generated/prisma/client.js';
import { Feature } from './feature.enum.js';

export type PlanFeatureLimit = number | null;

export type PlanLimitsConfig = Record<Feature, PlanFeatureLimit>;

/**
 * Single source of truth for plan feature limits.
 * `null` = unlimited.
 */
export const PLAN_FEATURE_LIMITS: Record<PlanName, PlanLimitsConfig> = {
  FREE: {
    [Feature.MEMBERS]: 5,
    [Feature.TRAINERS]: 1,
    [Feature.STAFF]: 2,
  },
  BASIC: {
    [Feature.MEMBERS]: 100,
    [Feature.TRAINERS]: 10,
    [Feature.STAFF]: 10,
  },
  PRO: {
    [Feature.MEMBERS]: null,
    [Feature.TRAINERS]: null,
    [Feature.STAFF]: null,
  },
};

export function getPlanFeatureLimit(
  planName: PlanName,
  feature: Feature,
): PlanFeatureLimit {
  const planLimits = PLAN_FEATURE_LIMITS[planName];

  if (!planLimits) {
    return PLAN_FEATURE_LIMITS.FREE[feature];
  }

  return planLimits[feature];
}

export function isUnlimitedLimit(limit: PlanFeatureLimit): limit is null {
  return limit === null;
}
