import type Stripe from 'stripe';
import { logger } from '@/core/logger.js';
import { BillingService } from '@/modules/billing/billing.service.js';
import { logBillingTrace } from '@/modules/billing/billing-trace.js';

const billingService = new BillingService();

export const stripeProcessor = {
  async process(event: Stripe.Event) {
    const eventId = event.id;
    const eventType = event.type;

    logger.info({
      msg: 'Stripe queue job processing',
      eventId,
      eventType,
    });

    logBillingTrace('webhook.job.start', { eventId, eventType });

    const result = await billingService.handleEvent(event);

    logBillingTrace('webhook.job.complete', {
      eventId,
      eventType,
      result: result.result,
      tenantId: result.tenantId,
    });
  },
};
