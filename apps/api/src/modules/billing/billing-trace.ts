import { logger } from '@/core/logger.js';

/**
 * Structured payment-flow tracing. Filter server logs with: BILLING_TRACE
 *
 * Example:
 *   grep BILLING_TRACE
 *   # or in JSON logs: "trace":"billing_payment"
 */
export function logBillingTrace(
  step: string,
  data?: Record<string, unknown>,
): void {
  if (process.env.BILLING_TRACE === 'false') return;
  logger.info({
    msg: `[BILLING_TRACE] ${step}`,
    trace: 'billing_payment',
    step,
    ...data,
  });
}

export function logBillingTraceError(
  step: string,
  data?: Record<string, unknown>,
): void {
  if (process.env.BILLING_TRACE === 'false') return;
  logger.error({
    msg: `[BILLING_TRACE] ${step}`,
    trace: 'billing_payment',
    step,
    ...data,
  });
}
