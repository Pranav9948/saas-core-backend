import { logger } from '@/core/logger.js';
import { NotFoundException } from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { BillingRepository } from './billing.repository.js';
import type { BillingSummaryResponseDto } from './billing-plans.dto.js';
import {
  mapFreePlanFallbackToSummary,
  mapSubscriptionToSummaryDto,
} from './billing-summary.mapper.js';

export class BillingSummaryService {
  constructor(private readonly billingRepo = new BillingRepository()) {}

  async getSummaryForTenant(
    tenantId: string,
  ): Promise<BillingSummaryResponseDto> {
    const startedAt = Date.now();

    logger.info({
      msg: 'Billing summary request received',
      tenantId,
    });

    const context =
      await this.billingRepo.getBillingSubscriptionReadModel(tenantId);

    if (!context) {
      throw new NotFoundException('Tenant not found', ErrorCode.NOT_FOUND);
    }

    if (context.subscription) {
      const data = mapSubscriptionToSummaryDto(context.subscription);

      logger.info({
        msg: 'Billing summary request completed',
        tenantId,
        planName: data.plan.name,
        status: data.status,
        daysRemaining: data.daysRemaining,
        durationMs: Date.now() - startedAt,
      });

      return data;
    }

    const freePlan = await this.billingRepo.findDefaultFreePlan();

    if (!freePlan) {
      throw new NotFoundException('Plan not configured', ErrorCode.NOT_FOUND);
    }

    const data = mapFreePlanFallbackToSummary(freePlan);

    logger.info({
      msg: 'Billing summary request completed',
      tenantId,
      planName: data.plan.name,
      status: data.status,
      daysRemaining: data.daysRemaining,
      durationMs: Date.now() - startedAt,
      fallback: 'free_plan',
    });

    return data;
  }
}
