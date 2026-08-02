import type { SubscriptionStatus } from '@/generated/prisma/client.js';
import type { BillingSubscriptionHealth } from './billing-plans.dto.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const SUBSCRIPTION_HEALTH_BY_STATUS: Record<
  SubscriptionStatus,
  BillingSubscriptionHealth
> = {
  ACTIVE: 'HEALTHY',
  TRIALING: 'TRIAL',
  PAST_DUE: 'PAYMENT_REQUIRED',
  CANCELED: 'CANCELED',
  INCOMPLETE: 'ACTION_REQUIRED',
};

export function resolveSubscriptionHealth(
  status: SubscriptionStatus,
): BillingSubscriptionHealth {
  return SUBSCRIPTION_HEALTH_BY_STATUS[status];
}

export function calculateDaysRemaining(
  currentPeriodEnd: Date | null,
  now: Date = new Date(),
): number {
  if (!currentPeriodEnd) {
    return 0;
  }

  const diffMs = currentPeriodEnd.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 0;
  }

  return Math.ceil(diffMs / MS_PER_DAY);
}
