import type { PlanName } from '@/generated/prisma/client.js';
import { NotFoundException } from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { Feature } from './feature.enum.js';
import {
  getPlanFeatureLimit,
  isUnlimitedLimit,
  type PlanFeatureLimit,
} from './plan-limits.config.js';
import { FeatureUsageRepository } from './feature-usage.repository.js';
import {
  buildFeatureUsageStat,
  buildFeatureUsageResponse,
} from './feature-usage.mapper.js';
import type { FeatureUsageStatDto } from './feature-usage.dto.js';

export class FeatureLimitService {
  constructor(private readonly repo = new FeatureUsageRepository()) {}

  async getPlanName(tenantId: string): Promise<PlanName> {
    const tenant = await this.repo.tenantExists(tenantId);

    if (!tenant) {
      throw new NotFoundException('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const planName = await this.repo.getSubscriptionPlanName(tenantId);
    return planName ?? 'FREE';
  }

  getFeatureLimit(planName: PlanName, feature: Feature): PlanFeatureLimit {
    return getPlanFeatureLimit(planName, feature);
  }

  isUnlimited(planName: PlanName, feature: Feature): boolean {
    return isUnlimitedLimit(this.getFeatureLimit(planName, feature));
  }

  async getUsedCount(tenantId: string, feature: Feature): Promise<number> {
    return this.repo.countByFeature(tenantId, feature);
  }

  async getFeatureUsage(
    tenantId: string,
    feature: Feature,
  ): Promise<FeatureUsageStatDto> {
    const planName = await this.getPlanName(tenantId);
    const used = await this.getUsedCount(tenantId, feature);
    const limit = this.getFeatureLimit(planName, feature);

    return buildFeatureUsageStat(used, limit);
  }

  remaining(planName: PlanName, feature: Feature, used: number): number | null {
    const limit = this.getFeatureLimit(planName, feature);

    if (isUnlimitedLimit(limit)) {
      return null;
    }

    const numericLimit = limit;
    return Math.max(numericLimit - used, 0);
  }

  async getAllFeatureUsage(tenantId: string) {
    const [tenant, planName, counts] = await Promise.all([
      this.repo.tenantExists(tenantId),
      this.repo.getSubscriptionPlanName(tenantId),
      this.repo.countAllUsage(tenantId),
    ]);

    if (!tenant) {
      throw new NotFoundException('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const resolvedPlan = planName ?? 'FREE';

    return buildFeatureUsageResponse(resolvedPlan, counts);
  }
}
