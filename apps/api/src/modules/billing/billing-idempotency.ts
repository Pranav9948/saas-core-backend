import { config } from '@/core/config.js';
import type { SubscriptionWithPlan } from './billing-subscription.policy.js';

/** Validated application environment — never read from raw process.env here. */
export function getAppEnvironment(): string {
  return config.NODE_ENV;
}

/**
 * Fingerprint of the tenant's current subscription row.
 *
 * When status/plan/Stripe sub changes (e.g. after cancel), the fingerprint
 * changes so a new Checkout Session idempotency key is issued. Retries in
 * the same billing state (double-click, network retry) reuse the same key.
 */
export function buildSubscriptionFingerprint(
  subscription: SubscriptionWithPlan | null | undefined,
): string {
  if (!subscription) {
    return 'none';
  }

  return [
    subscription.status,
    subscription.planId,
    subscription.stripeSubscriptionId ?? 'none',
  ].join('|');
}

/**
 * Stripe idempotency key for Checkout Session creation.
 *
 * Components:
 * - v1 namespace + environment: isolates dev/test/prod
 * - tenantId + planId + stripePriceId: target checkout intent
 * - subscription fingerprint: allows a fresh session after cancel/status change
 *
 * Not using tenantId+planId alone: a canceled tenant re-subscribing to the same
 * plan within 24h would receive a stale/expired Session from Stripe's cache.
 */
export function buildCheckoutIdempotencyKey(params: {
  tenantId: string;
  planId: string;
  stripePriceId: string;
  subscription: SubscriptionWithPlan | null | undefined;
}): string {
  return [
    'checkout',
    'v1',
    getAppEnvironment(),
    params.tenantId,
    params.planId,
    params.stripePriceId,
    buildSubscriptionFingerprint(params.subscription),
  ].join(':');
}

/** Idempotency key for lazy Stripe Customer creation (one customer per tenant). */
export function buildStripeCustomerIdempotencyKey(tenantId: string): string {
  return ['customer', 'v1', getAppEnvironment(), tenantId].join(':');
}
