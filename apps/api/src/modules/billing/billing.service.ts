import { BillingRepository } from './billing.repository.js';
import { BillingCheckoutService } from './billing-checkout.service.js';
import { BillingWebhookService } from './billing-webhook.service.js';
import { BillingPlansService } from './billing-plans.service.js';
import { BillingSubscriptionService } from './billing-subscription.service.js';
import { BillingSummaryService } from './billing-summary.service.js';
import { BillingCustomerPortalService } from './billing-customer-portal.service.js';
import { BillingPaymentHistoryService } from './billing-payment-history.service.js';
import { DEFAULT_PAYMENT_HISTORY_LIMIT } from './billing.constants.js';
import { FeatureUsageService } from '../feature-usage/feature-usage.service.js';
import type Stripe from 'stripe';

export class BillingService {
  private readonly checkoutService: BillingCheckoutService;
  private readonly webhookService: BillingWebhookService;
  private readonly plansService: BillingPlansService;
  private readonly subscriptionService: BillingSubscriptionService;
  private readonly summaryService: BillingSummaryService;
  private readonly customerPortalService: BillingCustomerPortalService;
  private readonly paymentHistoryService: BillingPaymentHistoryService;
  private readonly featureUsageService: FeatureUsageService;

  constructor(billingRepo = new BillingRepository()) {
    this.checkoutService = new BillingCheckoutService(billingRepo);
    this.webhookService = new BillingWebhookService(billingRepo);
    this.plansService = new BillingPlansService(billingRepo);
    this.subscriptionService = new BillingSubscriptionService(billingRepo);
    this.summaryService = new BillingSummaryService(billingRepo);
    this.customerPortalService = new BillingCustomerPortalService(billingRepo);
    this.paymentHistoryService = new BillingPaymentHistoryService(billingRepo);
    this.featureUsageService = new FeatureUsageService();
  }

  async createCheckoutSession(
    tenantId: string,
    userId: string,
    input: { planId?: string; priceId?: string },
  ) {
    return this.checkoutService.createSession({
      tenantId,
      userId,
      planId: input.planId,
      priceId: input.priceId,
    });
  }

  async handleEvent(event: Stripe.Event) {
    return this.webhookService.handleEvent(event);
  }

  async getBillingPlans(tenantId: string) {
    return this.plansService.getPlansForTenant(tenantId);
  }

  async getBillingSubscription(tenantId: string) {
    return this.subscriptionService.getSubscriptionForTenant(tenantId);
  }

  async getBillingSummary(tenantId: string) {
    return this.summaryService.getSummaryForTenant(tenantId);
  }

  async createCustomerPortalSession(tenantId: string) {
    return this.customerPortalService.createPortalSession(tenantId);
  }

  async getPaymentHistory(
    tenantId: string,
    query: { limit?: number; startingAfter?: string },
  ) {
    return this.paymentHistoryService.getPaymentHistoryForTenant(tenantId, {
      limit: query.limit ?? DEFAULT_PAYMENT_HISTORY_LIMIT,
      startingAfter: query.startingAfter,
    });
  }

  async getFeatureUsage(tenantId: string) {
    return this.featureUsageService.getUsageForTenant(tenantId);
  }
}
