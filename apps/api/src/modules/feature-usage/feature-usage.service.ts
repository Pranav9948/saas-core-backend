import { logger } from '@/core/logger.js';
import { FeatureLimitService } from './feature-limit.service.js';
import type { FeatureUsageResponseDto } from './feature-usage.dto.js';

export class FeatureUsageService {
  constructor(private readonly featureLimitService = new FeatureLimitService()) {}

  async getUsageForTenant(tenantId: string): Promise<FeatureUsageResponseDto> {
    const startedAt = Date.now();
    const data = await this.featureLimitService.getAllFeatureUsage(tenantId);

    logger.info({
      msg: 'Feature usage request completed',
      tenantId,
      plan: data.plan,
      membersUsed: data.members.used,
      trainersUsed: data.trainers.used,
      staffUsed: data.staff.used,
      durationMs: Date.now() - startedAt,
    });

    return data;
  }
}
