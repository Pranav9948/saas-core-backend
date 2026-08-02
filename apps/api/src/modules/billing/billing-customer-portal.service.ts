import { logger } from '@/core/logger.js';
import {
  BadRequestException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { buildCustomerPortalReturnUrl } from './billing.constants.js';
import { BillingRepository } from './billing.repository.js';
import { rethrowStripePortalError } from './billing-stripe.errors.js';
import { stripe } from './stripe.service.js';

export class BillingCustomerPortalService {
  constructor(private readonly billingRepo = new BillingRepository()) {}

  async createPortalSession(tenantId: string): Promise<string> {
    const startedAt = Date.now();

    logger.info({
      msg: 'Billing customer portal requested',
      tenantId,
    });

    const tenant = await this.billingRepo.getTenantPortalContext(tenantId);

    if (!tenant) {
      throw new NotFoundException('Tenant not found', ErrorCode.NOT_FOUND);
    }

    if (!tenant.stripeCustomerId) {
      throw new BadRequestException(
        'Billing account is not configured for this gym.',
      );
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: tenant.stripeCustomerId,
        return_url: buildCustomerPortalReturnUrl(),
      });

      if (!session.url) {
        logger.error({
          msg: 'Stripe customer portal session missing redirect URL',
          tenantId,
          sessionId: session.id,
        });
        throw new BadRequestException('Failed to create billing portal session');
      }

      logger.info({
        msg: 'Billing customer portal session created',
        tenantId,
        durationMs: Date.now() - startedAt,
      });

      return session.url;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      rethrowStripePortalError(error, {
        tenantId,
        operation: 'billingPortal.sessions.create',
      });
    }
  }
}
