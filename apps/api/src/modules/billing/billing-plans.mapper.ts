import type {
  BillingPlanCatalogRow,
  BillingPlanDto,
  BillingPlanFeatureDto,
} from './billing-plans.dto.js';
import { PLAN_DESCRIPTIONS } from './billing-plans.dto.js';

export function mapPlanFeatures(features: unknown): BillingPlanFeatureDto[] {
  if (!features || typeof features !== 'object' || Array.isArray(features)) {
    return [];
  }

  return Object.entries(features as Record<string, unknown>).map(
    ([key, value]) => ({
      key,
      value:
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
          ? value
          : String(value),
    }),
  );
}

export function mapPlanToDto(
  plan: BillingPlanCatalogRow,
  current: boolean,
): BillingPlanDto {
  return {
    id: plan.id,
    name: plan.name,
    description: PLAN_DESCRIPTIONS[plan.name],
    price: plan.price,
    currency: plan.currency,
    interval: plan.interval,
    features: mapPlanFeatures(plan.features),
    current,
  };
}

/**
 * Paid plans without a Stripe Price ID are treated as inactive/unavailable
 * because they cannot be purchased. FREE is always included.
 */
export function isCatalogPlanActive(plan: BillingPlanCatalogRow): boolean {
  if (plan.name === 'FREE') {
    return true;
  }

  return Boolean(plan.stripePriceId);
}

export function resolveCurrentPlanId(
  subscriptionPlanId: string | null | undefined,
  plans: BillingPlanCatalogRow[],
): string | null {
  if (subscriptionPlanId) {
    return subscriptionPlanId;
  }

  const freePlan = plans.find((plan) => plan.name === 'FREE');
  return freePlan?.id ?? null;
}
