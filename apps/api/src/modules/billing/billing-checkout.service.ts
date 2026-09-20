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
  buildCheckoutCancelUrl,
  buildCheckoutSuccessUrl,
} from './billing.constants.js';
import {
  hasActivePaidSubscription,
  isAlreadySubscribedToPlan,
  isPaidCheckoutPlan,
} from './billing-subscription.policy.js';
import { stripe } from './stripe.service.js';
import { logBillingTrace, logBillingTraceError } from './billing-trace.js';

export interface CreateCheckoutSessionParams {
  tenantId: string;
  userId: string;
  planId: string;
}

export class BillingCheckoutService {
  constructor(private readonly billingRepo = new BillingRepository()) {}

  async createSession(params: CreateCheckoutSessionParams): Promise<string> {
    const { tenantId, userId, planId } = params;

    logger.info({
      msg: 'Creating checkout session',
      tenantId,
      userId,
      planId,
    });

    const checkoutContext =
      await this.billingRepo.getTenantCheckoutContext(tenantId);

    if (!checkoutContext) {
      throw new NotFoundException('Tenant not found', ErrorCode.NOT_FOUND);
    }

    logBillingTrace('checkout.context_loaded', {
      tenantId,
      planId,
      currentPlanName: checkoutContext.subscription?.plan.name ?? 'NONE',
      currentStatus: checkoutContext.subscription?.status ?? 'NONE',
      hasStripeCustomer: Boolean(checkoutContext.stripeCustomerId),
    });

    const subscription = checkoutContext.subscription;

    if (hasActivePaidSubscription(subscription)) {
      logBillingTraceError('checkout.blocked_active_paid', {
        tenantId,
        planId,
        subscriptionStatus: subscription?.status,
        planName: subscription?.plan.name,
      });
      logger.warn({
        msg: 'Checkout blocked — active paid subscription exists',
        tenantId,
        subscriptionId: subscription?.id,
        subscriptionStatus: subscription?.status,
        planName: subscription?.plan.name,
        stripeSubscriptionId: subscription?.stripeSubscriptionId,
      });

      throw new ConflictException(
        'An active paid subscription already exists for this gym. Cancel or change your current plan before starting a new checkout.',
        ErrorCode.RESOURCE_ALREADY_EXISTS,
      );
    }

    if (isAlreadySubscribedToPlan(subscription, planId)) {
      logBillingTraceError('checkout.blocked_same_plan', { tenantId, planId });
      throw new ConflictException(
        'You are already subscribed to this plan.',
        ErrorCode.RESOURCE_ALREADY_EXISTS,
      );
    }

    const plan = await this.billingRepo.getPlanById(planId);

    if (!plan) {
      throw new NotFoundException('Plan not found', ErrorCode.NOT_FOUND);
    }

    if (!isPaidCheckoutPlan(plan)) {
      logBillingTraceError('checkout.plan_not_checkout_eligible', {
        tenantId,
        planId,
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

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: plan.stripePriceId!,
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
      stripeCustomerId: stripeCustomerId,
    });

    return session.url;
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
      // Kept for backward compatibility with existing webhook handlers.
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
