import { logger } from '@/core/logger.js';
import { NotFoundException } from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { BillingRepository } from './billing.repository.js';
import {
  isCatalogPlanActive,
  mapPlanToDto,
  resolveCurrentPlanId,
} from './billing-plans.mapper.js';
import type { BillingPlansResponseDto } from './billing-plans.dto.js';

export class BillingPlansService {
  constructor(private readonly billingRepo = new BillingRepository()) {}

  async getPlansForTenant(tenantId: string): Promise<BillingPlansResponseDto> {
    const startedAt = Date.now();

    logger.info({
      msg: 'Billing plans request received',
      tenantId,
    });

    const catalog = await this.billingRepo.getBillingPlansCatalog(tenantId);

    if (!catalog.tenant) {
      throw new NotFoundException('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const activePlans = catalog.plans.filter(isCatalogPlanActive);
    const currentPlanId = resolveCurrentPlanId(
      catalog.subscriptionPlanId,
      activePlans,
    );

    const plans = activePlans.map((plan) =>
      mapPlanToDto(plan, plan.id === currentPlanId),
    );

    logger.info({
      msg: 'Billing plans request completed',
      tenantId,
      plansCount: plans.length,
      durationMs: Date.now() - startedAt,
    });

    return { plans };
  }
}
