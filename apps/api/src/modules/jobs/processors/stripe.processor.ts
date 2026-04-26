import { logger } from '@/core/logger.js';
import { BillingService } from '@/modules/billing/billing.service.js';

const billingService = new BillingService();

export const stripeProcessor = {
  async process(event: any) {
    logger.info(`stripeProcessor event calling ${event}`);
    await billingService.handleEvent(event);
  },
};
