import { logger } from '@/core/logger.js';
import { NotFoundException } from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { BillingRepository } from './billing.repository.js';
import {
  mapFreePlanFallback,
  mapSubscriptionToDto,
} from './billing-subscription.mapper.js';
import type { BillingSubscriptionResponseDto } from './billing-plans.dto.js';

export class BillingSubscriptionService {
  constructor(private readonly billingRepo = new BillingRepository()) {}

  async getSubscriptionForTenant(
    tenantId: string,
  ): Promise<BillingSubscriptionResponseDto> {
    const startedAt = Date.now();

    logger.info({
      msg: 'Billing subscription request received',
      tenantId,
    });

    const context =
      await this.billingRepo.getBillingSubscriptionReadModel(tenantId);

    if (!context) {
      throw new NotFoundException('Tenant not found', ErrorCode.NOT_FOUND);
    }

    if (context.subscription) {
      const data = mapSubscriptionToDto(context.subscription);

      logger.info({
        msg: 'Billing subscription request completed',
        tenantId,
        status: data.status,
        planName: data.plan.name,
        durationMs: Date.now() - startedAt,
      });

      return data;
    }

    const freePlan = await this.billingRepo.findDefaultFreePlan();

    if (!freePlan) {
      throw new NotFoundException('Plan not configured', ErrorCode.NOT_FOUND);
    }

    const data = mapFreePlanFallback(freePlan);

    logger.info({
      msg: 'Billing subscription request completed',
      tenantId,
      status: data.status,
      planName: data.plan.name,
      durationMs: Date.now() - startedAt,
      fallback: 'free_plan',
    });

    return data;
  }
}
