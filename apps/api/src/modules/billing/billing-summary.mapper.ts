import type {
  BillingSubscriptionPlanSnapshot,
  BillingSubscriptionReadRow,
  BillingSummaryResponseDto,
} from './billing-plans.dto.js';
import {
  mapFreePlanFallback,
  mapSubscriptionToDto,
} from './billing-subscription.mapper.js';
import {
  calculateDaysRemaining,
  resolveSubscriptionHealth,
} from './billing-summary.utils.js';

function toSummaryFields(
  status: BillingSummaryResponseDto['status'],
  currentPeriodEnd: Date | null,
): Pick<
  BillingSummaryResponseDto,
  'health' | 'nextRenewal' | 'daysRemaining'
> {
  const nextRenewal = currentPeriodEnd ? currentPeriodEnd.toISOString() : null;

  return {
    health: resolveSubscriptionHealth(status),
    nextRenewal,
    daysRemaining: calculateDaysRemaining(currentPeriodEnd),
  };
}

export function mapSubscriptionToSummaryDto(
  subscription: BillingSubscriptionReadRow,
): BillingSummaryResponseDto {
  const base = mapSubscriptionToDto(subscription);

  return {
    ...base,
    ...toSummaryFields(subscription.status, subscription.currentPeriodEnd),
  };
}

export function mapFreePlanFallbackToSummary(
  plan: BillingSubscriptionPlanSnapshot,
): BillingSummaryResponseDto {
  const base = mapFreePlanFallback(plan);

  return {
    ...base,
    ...toSummaryFields(base.status, null),
  };
}
