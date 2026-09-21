import { config } from '@/core/config.js';

/** Subscription statuses that indicate an existing paid billing relationship. */
export const BLOCKING_SUBSCRIPTION_STATUSES = [
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
] as const;

export const BILLING_PAGE_PATH = '/owner/billing';
export const CHECKOUT_SUCCESS_PATH = BILLING_PAGE_PATH;
export const CHECKOUT_CANCEL_PATH = BILLING_PAGE_PATH;
export const CUSTOMER_PORTAL_RETURN_PATH = BILLING_PAGE_PATH;

export const DEFAULT_PAYMENT_HISTORY_LIMIT = 10;
export const MAX_PAYMENT_HISTORY_LIMIT = 100;

function frontendOrigin(): string {
  return config.FRONTEND_URL.replace(/\/$/, '');
}

export function buildCheckoutSuccessUrl(): string {
  return `${frontendOrigin()}${BILLING_PAGE_PATH}?success=true&session_id={CHECKOUT_SESSION_ID}`;
}

export function buildCheckoutCancelUrl(): string {
  return `${frontendOrigin()}${BILLING_PAGE_PATH}?canceled=true`;
}

export function buildBillingSuccessUrl(): string {
  return `${frontendOrigin()}${BILLING_PAGE_PATH}?success=true`;
}

export function buildCustomerPortalReturnUrl(): string {
  return `${frontendOrigin()}${CUSTOMER_PORTAL_RETURN_PATH}`;
}
