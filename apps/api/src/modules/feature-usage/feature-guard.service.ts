import { logger } from '@/core/logger.js';
import { FeatureLimitReachedException } from '@/exceptions/feature-limit.exception.js';
import { Feature } from './feature.enum.js';
import { FeatureLimitService } from './feature-limit.service.js';
import { isUnlimitedLimit } from './plan-limits.config.js';

const FEATURE_LIMIT_MESSAGES: Record<Feature, string> = {
  [Feature.MEMBERS]:
    'Member limit reached for your current plan. Upgrade to continue.',
  [Feature.TRAINERS]:
    'Trainer limit reached for your current plan. Upgrade to continue.',
  [Feature.STAFF]:
    'Staff limit reached for your current plan. Upgrade to continue.',
};

export class FeatureGuardService {
  constructor(private readonly featureLimitService = new FeatureLimitService()) {}

  async ensureCanUseFeature(tenantId: string, feature: Feature): Promise<void> {
    const startedAt = Date.now();
    const planName = await this.featureLimitService.getPlanName(tenantId);
    const limit = this.featureLimitService.getFeatureLimit(planName, feature);

    if (isUnlimitedLimit(limit)) {
      return;
    }

    const used = await this.featureLimitService.getUsedCount(tenantId, feature);
    const numericLimit = limit;

    if (used >= numericLimit) {
      logger.warn({
        msg: 'Feature limit reached — request blocked',
        tenantId,
        plan: planName,
        feature,
        limit: numericLimit,
        used,
        durationMs: Date.now() - startedAt,
      });

      throw new FeatureLimitReachedException({
        feature,
        currentPlan: planName,
        limit: numericLimit,
        used,
        message: FEATURE_LIMIT_MESSAGES[feature],
      });
    }
  }

  async ensureCanCreateMember(tenantId: string): Promise<void> {
    await this.ensureCanUseFeature(tenantId, Feature.MEMBERS);
  }

  async ensureCanCreateTrainer(tenantId: string): Promise<void> {
    await this.ensureCanUseFeature(tenantId, Feature.TRAINERS);
  }

  async ensureCanCreateStaff(tenantId: string): Promise<void> {
    await this.ensureCanUseFeature(tenantId, Feature.STAFF);
  }
}
