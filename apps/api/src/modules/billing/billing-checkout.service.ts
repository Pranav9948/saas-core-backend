import type { Plan } from '@/generated/prisma/client.js';
import { logger } from '@/core/logger.js';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { BillingRepository } from './billing.repository.js';
import {
  buildBillingSuccessUrl,
  buildCheckoutCancelUrl,
  buildCheckoutSuccessUrl,
} from './billing.constants.js';
import {
  hasActivePaidSubscription,
  isAlreadySubscribedToPlan,
  isPaidCheckoutPlan,
} from './billing-subscription.policy.js';
import {
  extractSubscriptionPeriod,
  mapStripeSubscriptionStatus,
} from './billing-stripe-sync.js';
import { rethrowStripeCheckoutError } from './billing-stripe.errors.js';
import { stripe } from './stripe.service.js';
import { logBillingTrace, logBillingTraceError } from './billing-trace.js';

export interface CreateCheckoutSessionParams {
  tenantId: string;
  userId: string;
  planId?: string;
  priceId?: string;
}

export class BillingCheckoutService {
  constructor(private readonly billingRepo = new BillingRepository()) {}

  async createSession(params: CreateCheckoutSessionParams): Promise<string> {
    const { tenantId, userId, planId, priceId } = params;

    logger.info({
      msg: 'Creating checkout session',
      tenantId,
      userId,
      planId,
      priceId,
    });

    const checkoutContext =
      await this.billingRepo.getTenantCheckoutContext(tenantId);

    if (!checkoutContext) {
      throw new NotFoundException('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const plan = await this.resolveCheckoutPlan(planId, priceId);

    logBillingTrace('checkout.context_loaded', {
      tenantId,
      planId: plan.id,
      priceId: plan.stripePriceId,
      currentPlanName: checkoutContext.subscription?.plan.name ?? 'NONE',
      currentStatus: checkoutContext.subscription?.status ?? 'NONE',
      hasStripeCustomer: Boolean(checkoutContext.stripeCustomerId),
    });

    const subscription = checkoutContext.subscription;

    if (isAlreadySubscribedToPlan(subscription, plan.id)) {
      logBillingTraceError('checkout.blocked_same_plan', {
        tenantId,
        planId: plan.id,
      });
      throw new ConflictException(
        'You are already subscribed to this plan.',
        ErrorCode.RESOURCE_ALREADY_EXISTS,
      );
    }

    if (!isPaidCheckoutPlan(plan)) {
      logBillingTraceError('checkout.plan_not_checkout_eligible', {
        tenantId,
        planId: plan.id,
        planName: plan.name,
      });
      throw new BadRequestException(
        'Selected plan is not available for Stripe checkout',
      );
    }

    const stripeCustomerId = await this.ensureStripeCustomer(
      tenantId,
      checkoutContext.name,
      checkoutContext.stripeCustomerId,
    );

    if (
      hasActivePaidSubscription(subscription) &&
      subscription?.stripeSubscriptionId
    ) {
      return this.upgradeExistingSubscription({
        tenantId,
        userId,
        plan,
        stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: buildCheckoutSuccessUrl(),
        cancel_url: buildCheckoutCancelUrl(),
        client_reference_id: tenantId,
        metadata: this.buildCheckoutMetadata({
          tenantId,
          userId,
          plan,
        }),
        subscription_data: {
          metadata: this.buildCheckoutMetadata({
            tenantId,
            userId,
            plan,
          }),
        },
      });

      if (!session.url) {
        logger.error({
          msg: 'Stripe checkout session missing redirect URL',
          tenantId,
          sessionId: session.id,
        });
        throw new BadRequestException('Failed to create checkout session');
      }

      logBillingTrace('checkout.stripe_session_created', {
        tenantId,
        userId,
        planId: plan.id,
        planName: plan.name,
        billingInterval: plan.interval,
        sessionId: session.id,
        stripeCustomerId,
      });

      return session.url;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      rethrowStripeCheckoutError(error, {
        tenantId,
        operation: 'checkout.sessions.create',
      });
    }
  }

  private async resolveCheckoutPlan(
    planId?: string,
    priceId?: string,
  ): Promise<Plan> {
    if (planId) {
      const plan = await this.billingRepo.getPlanById(planId);
      if (!plan) {
        throw new NotFoundException('Plan not found', ErrorCode.NOT_FOUND);
      }
      return plan;
    }

    if (priceId) {
      const plan = await this.billingRepo.findPlanByStripePriceId(priceId);
      if (!plan) {
        throw new NotFoundException(
          'No plan is mapped to this Stripe price',
          ErrorCode.NOT_FOUND,
        );
      }
      return plan;
    }

    throw new BadRequestException('planId or priceId is required');
  }

  private async upgradeExistingSubscription(params: {
    tenantId: string;
    userId: string;
    plan: Plan & { stripePriceId: string };
    stripeCustomerId: string;
    stripeSubscriptionId: string;
  }): Promise<string> {
    const { tenantId, userId, plan, stripeCustomerId, stripeSubscriptionId } =
      params;

    logBillingTrace('checkout.upgrade_existing', {
      tenantId,
      planId: plan.id,
      stripeSubscriptionId,
    });

    try {
      const existing = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      const itemId = existing.items.data[0]?.id;

      if (!itemId) {
        throw new BadRequestException(
          'Unable to change plan because the Stripe subscription has no items',
        );
      }

      const updated = await stripe.subscriptions.update(stripeSubscriptionId, {
        items: [{ id: itemId, price: plan.stripePriceId }],
        proration_behavior: 'create_prorations',
        metadata: this.buildCheckoutMetadata({ tenantId, userId, plan }),
      });

      const period = extractSubscriptionPeriod(updated);

      await this.billingRepo.ensureTenantStripeCustomerId(
        tenantId,
        stripeCustomerId,
      );

      await this.billingRepo.upsertSubscriptionByTenant({
        tenantId,
        planId: plan.id,
        stripeCustomerId,
        stripeSubscriptionId,
        status: mapStripeSubscriptionStatus(updated.status),
        currentPeriodStart: period.start,
        currentPeriodEnd: period.end,
        cancelAtPeriodEnd: updated.cancel_at_period_end ?? false,
      });

      logBillingTrace('checkout.upgrade_persisted', {
        tenantId,
        planId: plan.id,
        stripeSubscriptionId,
        status: updated.status,
      });

      return buildBillingSuccessUrl();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      rethrowStripeCheckoutError(error, {
        tenantId,
        operation: 'subscriptions.update',
      });
    }
  }

  private buildCheckoutMetadata({
    tenantId,
    userId,
    plan,
  }: {
    tenantId: string;
    userId: string;
    plan: Plan;
  }): Record<string, string> {
    return {
      tenantId,
      userId,
      planId: plan.id,
      billingInterval: plan.interval,
      planName: plan.name,
      interval: plan.interval,
    };
  }

  private async ensureStripeCustomer(
    tenantId: string,
    tenantName: string,
    existingCustomerId: string | null,
  ): Promise<string> {
    if (existingCustomerId) {
      return existingCustomerId;
    }

    logger.info({
      msg: 'Creating Stripe customer for tenant',
      tenantId,
    });

    const customer = await stripe.customers.create({
      name: tenantName,
      metadata: {
        tenantId,
      },
    });

    await this.billingRepo.updateStripeCustomerId(tenantId, customer.id);

    logger.info({
      msg: 'Stripe customer linked to tenant',
      tenantId,
      stripeCustomerId: customer.id,
    });

    return customer.id;
  }
}
