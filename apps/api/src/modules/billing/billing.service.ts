import { BillingRepository } from './billing.repository.js';
import { BillingCheckoutService } from './billing-checkout.service.js';
import { BillingWebhookService } from './billing-webhook.service.js';
import { BillingPlansService } from './billing-plans.service.js';
import type Stripe from 'stripe';

export class BillingService {
  private readonly checkoutService: BillingCheckoutService;
  private readonly webhookService: BillingWebhookService;
  private readonly plansService: BillingPlansService;

  constructor(billingRepo = new BillingRepository()) {
    this.checkoutService = new BillingCheckoutService(billingRepo);
    this.webhookService = new BillingWebhookService(billingRepo);
    this.plansService = new BillingPlansService(billingRepo);
  }

  async createCheckoutSession(
    tenantId: string,
    userId: string,
    planId: string,
  ) {
    return this.checkoutService.createSession({ tenantId, userId, planId });
  }

  async handleEvent(event: Stripe.Event) {
    return this.webhookService.handleEvent(event);
  }

  async getBillingPlans(tenantId: string) {
    return this.plansService.getPlansForTenant(tenantId);
  }
}
