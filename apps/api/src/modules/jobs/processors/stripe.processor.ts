import type Stripe from 'stripe';
import { logger } from '@/core/logger.js';
import { BillingService } from '@/modules/billing/billing.service.js';

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

    await billingService.handleEvent(event);
  },
};
