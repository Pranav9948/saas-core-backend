import type {
  BillingSubscriptionPlanSnapshot,
  BillingSubscriptionReadRow,
  BillingSubscriptionResponseDto,
} from './billing-plans.dto.js';
import { PLAN_DESCRIPTIONS } from './billing-plans.dto.js';

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function mapSubscriptionToDto(
  subscription: BillingSubscriptionReadRow,
): BillingSubscriptionResponseDto {
  return {
    plan: {
      name: subscription.plan.name,
      description: PLAN_DESCRIPTIONS[subscription.plan.name],
      price: subscription.plan.price,
      currency: subscription.plan.currency,
    },
    status: subscription.status,
    billingInterval: subscription.plan.interval,
    currentPeriodStart: toIsoString(subscription.currentPeriodStart),
    currentPeriodEnd: toIsoString(subscription.currentPeriodEnd),
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    isPaid: subscription.plan.name !== 'FREE',
  };
}

export function mapFreePlanFallback(
  plan: BillingSubscriptionPlanSnapshot,
): BillingSubscriptionResponseDto {
  return {
    plan: {
      name: plan.name,
      description: PLAN_DESCRIPTIONS[plan.name],
      price: plan.price,
      currency: plan.currency,
    },
    status: 'ACTIVE',
    billingInterval: plan.interval,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    isPaid: false,
  };
}
