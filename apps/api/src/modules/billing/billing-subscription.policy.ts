import type { Plan, Subscription } from '@/generated/prisma/client.js';
import {
  BadRequestException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { BLOCKING_SUBSCRIPTION_STATUSES } from './billing.constants.js';

export type SubscriptionWithPlan = Subscription & { plan: Plan };

/**
 * Returns true when the tenant already has a paid Stripe-backed subscription
 * that should block creating a new Checkout Session.
 *
 * Blocks: ACTIVE / TRIALING / PAST_DUE on paid plans or with a Stripe sub ID.
 * Allows: FREE (no Stripe sub), CANCELED, INCOMPLETE.
 *
 * Note: `EXPIRED` is not a Prisma SubscriptionStatus; use CANCELED.
 */
export function hasActivePaidSubscription(
  subscription: SubscriptionWithPlan | null | undefined,
): boolean {
  if (!subscription) {
    return false;
  }

  if (
    !BLOCKING_SUBSCRIPTION_STATUSES.includes(
      subscription.status as (typeof BLOCKING_SUBSCRIPTION_STATUSES)[number],
    )
  ) {
    return false;
  }

  if (subscription.plan.name === 'FREE' && !subscription.stripeSubscriptionId) {
    return false;
  }

  return (
    subscription.plan.name !== 'FREE' || !!subscription.stripeSubscriptionId
  );
}

export function isAlreadySubscribedToPlan(
  subscription: SubscriptionWithPlan | null | undefined,
  planId: string,
): boolean {
  if (!subscription) {
    return false;
  }

  return (
    subscription.planId === planId &&
    subscription.status === 'ACTIVE' &&
    subscription.plan.name !== 'FREE'
  );
}

export function isPaidCheckoutPlan(
  plan: Plan,
): plan is Plan & { stripePriceId: string } {
  return plan.name !== 'FREE' && !!plan.stripePriceId;
}

/**
 * Validates plan eligibility for Stripe Checkout and throws domain errors.
 */
export function assertCheckoutPlanEligible(plan: Plan | null): asserts plan is Plan & {
  stripePriceId: string;
} {
  if (!plan) {
    throw new NotFoundException('Plan not found', ErrorCode.NOT_FOUND);
  }

  if (plan.name === 'FREE') {
    throw new BadRequestException('The FREE plan cannot be purchased with Stripe');
  }

  if (!plan.stripePriceId) {
    throw new BadRequestException(
      'This plan is not available for checkout because it has no Stripe price',
    );
  }
}
