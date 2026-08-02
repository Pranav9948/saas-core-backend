import type { SubscriptionStatus } from '@/generated/prisma/client.js';
import type Stripe from 'stripe';

const ACTIVE_STRIPE_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
]);

const PAST_DUE_STRIPE_STATUSES = new Set<Stripe.Subscription.Status>([
  'past_due',
  'unpaid',
]);

const CANCELED_STRIPE_STATUSES = new Set<Stripe.Subscription.Status>([
  'canceled',
  'incomplete_expired',
]);

const INCOMPLETE_STRIPE_STATUSES = new Set<Stripe.Subscription.Status>([
  'incomplete',
  'paused',
]);

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  if (ACTIVE_STRIPE_STATUSES.has(status)) {
    return status === 'trialing' ? 'TRIALING' : 'ACTIVE';
  }

  if (PAST_DUE_STRIPE_STATUSES.has(status)) {
    return 'PAST_DUE';
  }

  if (CANCELED_STRIPE_STATUSES.has(status)) {
    return 'CANCELED';
  }

  if (INCOMPLETE_STRIPE_STATUSES.has(status)) {
    return 'INCOMPLETE';
  }

  return 'INCOMPLETE';
}

export function getStripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) {
    return null;
  }

  return typeof customer === 'string' ? customer : customer.id;
}

export function getStripeSubscriptionId(
  subscription: string | Stripe.Subscription | null | undefined,
): string | null {
  if (!subscription) {
    return null;
  }

  return typeof subscription === 'string' ? subscription : subscription.id;
}

export function extractSubscriptionIdFromInvoice(
  invoice: Stripe.Invoice,
): string | null {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };

  const direct = getStripeSubscriptionId(invoiceWithSubscription.subscription);

  if (direct) {
    return direct;
  }

  const legacy = invoice as Stripe.Invoice & {
    parent?: { subscription_details?: { subscription?: string | null } };
    lines?: {
      data?: Array<{
        parent?: { subscription_item_details?: { subscription?: string | null } };
      }>;
    };
  };

  const fromParent = legacy.parent?.subscription_details?.subscription;
  if (typeof fromParent === 'string') {
    return fromParent;
  }

  const fromLine =
    legacy.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;

  return typeof fromLine === 'string' ? fromLine : null;
}

export function extractInvoicePeriod(invoice: Stripe.Invoice): {
  start: Date | null;
  end: Date | null;
} {
  const linePeriod = invoice.lines?.data?.[0]?.period;

  const startSeconds = linePeriod?.start ?? invoice.period_start ?? null;
  const endSeconds = linePeriod?.end ?? invoice.period_end ?? null;

  return {
    start: startSeconds ? new Date(startSeconds * 1000) : null,
    end: endSeconds ? new Date(endSeconds * 1000) : null,
  };
}

export function extractSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: Date | null;
  end: Date | null;
} {
  const extended = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };

  const item = subscription.items?.data?.[0] as
    | (Stripe.SubscriptionItem & {
        current_period_start?: number;
        current_period_end?: number;
      })
    | undefined;

  const startSeconds =
    extended.current_period_start ?? item?.current_period_start ?? null;
  const endSeconds =
    extended.current_period_end ?? item?.current_period_end ?? null;

  return {
    start: startSeconds ? new Date(startSeconds * 1000) : null,
    end: endSeconds ? new Date(endSeconds * 1000) : null,
  };
}

export function readMetadata(
  metadata: Stripe.Metadata | null | undefined,
): Record<string, string> {
  return metadata ?? {};
}

export function getStripePriceId(
  subscription: Stripe.Subscription,
): string | null {
  const price = subscription.items?.data?.[0]?.price;
  if (!price) {
    return null;
  }

  return typeof price === 'string' ? price : price.id;
}
