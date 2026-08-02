import { config } from '@/core/config.js';

/** Subscription statuses that indicate an existing paid billing relationship. */
export const BLOCKING_SUBSCRIPTION_STATUSES = [
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
] as const;

export const CHECKOUT_SUCCESS_PATH = '/owner/billing/success';
export const CHECKOUT_CANCEL_PATH = '/owner/billing/cancel';
export const CUSTOMER_PORTAL_RETURN_PATH = '/owner/billing';

export function buildCheckoutSuccessUrl(): string {
  const base = config.FRONTEND_URL.replace(/\/$/, '');
  return `${base}${CHECKOUT_SUCCESS_PATH}?session_id={CHECKOUT_SESSION_ID}`;
}

export function buildCheckoutCancelUrl(): string {
  const base = config.FRONTEND_URL.replace(/\/$/, '');
  return `${base}${CHECKOUT_CANCEL_PATH}`;
}

export function buildCustomerPortalReturnUrl(): string {
  const base = config.FRONTEND_URL.replace(/\/$/, '');
  return `${base}${CUSTOMER_PORTAL_RETURN_PATH}`;
}
