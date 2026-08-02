import { logger } from '@/core/logger.js';
import {
  BadRequestException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import {
  DEFAULT_PAYMENT_HISTORY_LIMIT,
  MAX_PAYMENT_HISTORY_LIMIT,
} from './billing.constants.js';
import { BillingRepository } from './billing.repository.js';
import type {
  BillingPaymentHistoryQuery,
  BillingPaymentHistoryResponseDto,
} from './billing-payment-history.dto.js';
import { mapStripeInvoicesToPaymentHistory } from './billing-payment-history.mapper.js';
import { rethrowStripePaymentHistoryError } from './billing-stripe.errors.js';
import { stripe } from './stripe.service.js';

export class BillingPaymentHistoryService {
  constructor(private readonly billingRepo = new BillingRepository()) {}

  async getPaymentHistoryForTenant(
    tenantId: string,
    query: BillingPaymentHistoryQuery,
  ): Promise<BillingPaymentHistoryResponseDto> {
    const startedAt = Date.now();

    logger.info({
      msg: 'Billing payment history requested',
      tenantId,
      limit: query.limit,
      hasStartingAfter: Boolean(query.startingAfter),
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

    const limit = Math.min(
      Math.max(query.limit || DEFAULT_PAYMENT_HISTORY_LIMIT, 1),
      MAX_PAYMENT_HISTORY_LIMIT,
    );

    try {
      const invoices = await stripe.invoices.list({
        customer: tenant.stripeCustomerId,
        limit,
        ...(query.startingAfter ? { starting_after: query.startingAfter } : {}),
      });

      const data = mapStripeInvoicesToPaymentHistory(invoices);

      logger.info({
        msg: 'Billing payment history request completed',
        tenantId,
        invoiceCount: data.payments.length,
        hasMore: data.pagination.hasMore,
        durationMs: Date.now() - startedAt,
      });

      return data;
    } catch (error) {
      rethrowStripePaymentHistoryError(error, {
        tenantId,
        operation: 'invoices.list',
      });
    }
  }
}
