import type { PlanName } from '@/generated/prisma/client.js';
import type { Feature } from './feature.enum.js';

export interface FeatureUsageStatDto {
  used: number;
  limit: number | null;
  remaining: number | null;
  percentageUsed: number;
  isUnlimited: boolean;
  isLimitReached: boolean;
}

export type FeatureUsageStatsMap = Record<
  Lowercase<Feature>,
  FeatureUsageStatDto
>;

export interface FeatureUsageResponseDto {
  plan: PlanName;
  members: FeatureUsageStatDto;
  trainers: FeatureUsageStatDto;
  staff: FeatureUsageStatDto;
}

export interface FeatureLimitContext {
  planName: PlanName;
  feature: Feature;
  used: number;
  limit: number;
}
