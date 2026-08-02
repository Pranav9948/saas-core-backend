import Stripe from 'stripe';
import { BadGatewayException } from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { logger } from '@/core/logger.js';

/**
 * Maps Stripe SDK errors to safe domain errors without leaking Stripe internals.
 */
export function rethrowStripeCheckoutError(
  error: unknown,
  context: { tenantId: string; operation: string },
): never {
  if (error instanceof Stripe.errors.StripeConnectionError) {
    logger.error({
      msg: 'Stripe connection error during checkout',
      tenantId: context.tenantId,
      operation: context.operation,
    });
    throw new BadGatewayException(
      'Payment service temporarily unavailable. Please try again.',
      ErrorCode.SERVICE_UNAVAILABLE,
    );
  }

  if (error instanceof Stripe.errors.StripeRateLimitError) {
    logger.warn({
      msg: 'Stripe rate limit during checkout',
      tenantId: context.tenantId,
      operation: context.operation,
    });
    throw new BadGatewayException(
      'Payment service is busy. Please try again shortly.',
      ErrorCode.SERVICE_UNAVAILABLE,
    );
  }

  if (
    error instanceof Stripe.errors.StripeAPIError &&
    typeof error.statusCode === 'number' &&
    error.statusCode >= 500
  ) {
    logger.error({
      msg: 'Stripe API error during checkout',
      tenantId: context.tenantId,
      operation: context.operation,
      statusCode: error.statusCode,
    });
    throw new BadGatewayException(
      'Payment service temporarily unavailable. Please try again.',
      ErrorCode.SERVICE_UNAVAILABLE,
    );
  }

  if (error instanceof Stripe.errors.StripeError) {
    logger.error({
      msg: 'Stripe error during checkout',
      tenantId: context.tenantId,
      operation: context.operation,
      type: error.type,
    });
    throw new BadGatewayException(
      'Unable to start checkout. Please try again.',
      ErrorCode.SERVICE_UNAVAILABLE,
    );
  }

  throw error;
}
