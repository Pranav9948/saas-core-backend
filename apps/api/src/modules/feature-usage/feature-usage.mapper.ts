import type { PlanName } from '@/generated/prisma/client.js';
import { Feature } from './feature.enum.js';
import {
  getPlanFeatureLimit,
  isUnlimitedLimit,
  type PlanFeatureLimit,
} from './plan-limits.config.js';
import type { FeatureUsageStatDto } from './feature-usage.dto.js';

export function buildFeatureUsageStat(
  used: number,
  limit: PlanFeatureLimit,
): FeatureUsageStatDto {
  const unlimited = isUnlimitedLimit(limit);

  if (unlimited) {
    return {
      used,
      limit: null,
      remaining: null,
      percentageUsed: 0,
      isUnlimited: true,
      isLimitReached: false,
    };
  }

  const numericLimit = limit;
  const remaining = Math.max(numericLimit - used, 0);
  const percentageUsed = Math.min(
    Math.round((used / numericLimit) * 100),
    100,
  );

  return {
    used,
    limit: numericLimit,
    remaining,
    percentageUsed,
    isUnlimited: false,
    isLimitReached: used >= numericLimit,
  };
}

export function buildFeatureUsageResponse(
  planName: PlanName,
  counts: { members: number; trainers: number; staff: number },
) {
  return {
    plan: planName,
    members: buildFeatureUsageStat(
      counts.members,
      getPlanFeatureLimit(planName, Feature.MEMBERS),
    ),
    trainers: buildFeatureUsageStat(
      counts.trainers,
      getPlanFeatureLimit(planName, Feature.TRAINERS),
    ),
    staff: buildFeatureUsageStat(
      counts.staff,
      getPlanFeatureLimit(planName, Feature.STAFF),
    ),
  };
}
