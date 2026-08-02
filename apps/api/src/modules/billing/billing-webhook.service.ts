import type { Prisma } from '@/generated/prisma/client.js';
import type Stripe from 'stripe';
import { prisma } from '@/infra/db.js';
import { logger } from '@/core/logger.js';
import { BillingRepository } from './billing.repository.js';
import {
  extractInvoicePeriod,
  extractSubscriptionIdFromInvoice,
  extractSubscriptionPeriod,
  getStripeCustomerId,
  getStripePriceId,
  getStripeSubscriptionId,
  mapStripeSubscriptionStatus,
  readMetadata,
} from './billing-stripe-sync.js';
import type {
  SubscriptionSyncData,
  WebhookProcessingResult,
} from './billing-webhook.types.js';
import { stripe } from './stripe.service.js';

export class BillingWebhookService {
  constructor(private readonly billingRepo = new BillingRepository()) {}

  async handleEvent(event: Stripe.Event): Promise<WebhookProcessingResult> {
    const startedAt = Date.now();
    const eventId = event.id;
    const eventType = event.type;

    logger.info({
      msg: 'Webhook processing started',
      eventId,
      eventType,
    });

    let duplicate = false;
    let processingResult: WebhookProcessingResult = { result: 'success' };

    try {
      await prisma.$transaction(
        async (tx) => {
          try {
            await tx.stripeEvent.create({
              data: {
                id: eventId,
                type: eventType,
              },
            });
          } catch (error: unknown) {
            const prismaError = error as { code?: string };
            if (prismaError.code === 'P2002') {
              duplicate = true;
              return;
            }
            throw error;
          }

          processingResult = await this.dispatchEvent(event, tx);
        },
        { timeout: 30_000 },
      );
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      logger.error({
        msg: 'Webhook processing failed',
        eventId,
        eventType,
        durationMs,
        result: 'failed',
        err: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    const durationMs = Date.now() - startedAt;

    if (duplicate) {
      logger.warn({
        msg: 'Webhook duplicate skipped',
        eventId,
        eventType,
        durationMs,
        result: 'duplicate',
      });
      return { result: 'duplicate' };
    }

    logger.info({
      msg: 'Webhook processing finished',
      eventId,
      eventType,
      tenantId: processingResult.tenantId,
      stripeSubscriptionId: processingResult.stripeSubscriptionId,
      durationMs,
      result: processingResult.result,
    });

    return processingResult;
  }

  private async dispatchEvent(
    event: Stripe.Event,
    tx: Prisma.TransactionClient,
  ): Promise<WebhookProcessingResult> {
    const eventType = event.type as string;

    switch (eventType) {
      case 'checkout.session.completed':
        return this.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
          tx,
        );

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        return this.handleSubscriptionChanged(
          event.data.object as Stripe.Subscription,
          tx,
        );

      case 'customer.subscription.deleted':
        return this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
          tx,
        );

      case 'invoice.payment_succeeded':
        return this.handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
          tx,
        );

      case 'invoice.payment_failed':
        return this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
          tx,
        );

      case 'invoice_payment.paid':
      case 'invoice_payment.failed':
        logger.info({
          msg: 'Webhook event skipped',
          eventType: event.type,
          result: 'skipped',
        });
        return { result: 'skipped' };

      default:
        logger.debug({
          msg: 'Webhook event unhandled',
          eventType: event.type,
          result: 'skipped',
        });
        return { result: 'skipped' };
    }
  }

  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
    tx: Prisma.TransactionClient,
  ): Promise<WebhookProcessingResult> {
    const metadata = readMetadata(session.metadata);
    const tenantId = metadata.tenantId;
    const planId = metadata.planId;

    if (!tenantId || !planId) {
      throw new Error('checkout.session.completed missing tenantId or planId metadata');
    }

    const stripeCustomerId = getStripeCustomerId(session.customer);
    const stripeSubscriptionId = getStripeSubscriptionId(
      session.subscription as string | Stripe.Subscription | null,
    );

    if (!stripeSubscriptionId) {
      throw new Error('checkout.session.completed missing subscription id');
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      stripeSubscriptionId,
    );

    const syncData = await this.buildSyncDataFromStripeSubscription(
      stripeSubscription,
      {
        tenantId,
        planId,
        stripeCustomerId,
      },
    );

    if (!syncData) {
      throw new Error(
        `Unable to resolve subscription sync data for tenant ${tenantId}`,
      );
    }

    await this.persistSubscriptionSync(syncData, tx);

    return {
      result: 'success',
      tenantId: syncData.tenantId,
      stripeSubscriptionId: syncData.stripeSubscriptionId,
    };
  }

  private async handleSubscriptionChanged(
    subscription: Stripe.Subscription,
    tx: Prisma.TransactionClient,
  ): Promise<WebhookProcessingResult> {
    const syncData = await this.buildSyncDataFromStripeSubscription(subscription);

    if (!syncData) {
      logger.warn({
        msg: 'Webhook subscription sync skipped — tenant unresolved',
        stripeSubscriptionId: subscription.id,
        result: 'skipped',
      });
      return { result: 'skipped', stripeSubscriptionId: subscription.id };
    }

    await this.persistSubscriptionSync(syncData, tx);

    return {
      result: 'success',
      tenantId: syncData.tenantId,
      stripeSubscriptionId: syncData.stripeSubscriptionId,
    };
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
    tx: Prisma.TransactionClient,
  ): Promise<WebhookProcessingResult> {
    const existing = await this.billingRepo.findSubscriptionByStripeSubscriptionId(
      subscription.id,
    );

    if (!existing) {
      const syncData = await this.buildSyncDataFromStripeSubscription(subscription);

      if (!syncData) {
        logger.warn({
          msg: 'Webhook subscription delete skipped — record not found',
          stripeSubscriptionId: subscription.id,
          result: 'skipped',
        });
        return { result: 'skipped', stripeSubscriptionId: subscription.id };
      }

      await this.persistSubscriptionSync(
        {
          ...syncData,
          status: 'CANCELED',
          cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        },
        tx,
      );

      return {
        result: 'success',
        tenantId: syncData.tenantId,
        stripeSubscriptionId: subscription.id,
      };
    }

    await this.billingRepo.updateSubscriptionByStripeId(
      subscription.id,
      {
        status: 'CANCELED',
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      },
      tx,
    );

    return {
      result: 'success',
      tenantId: existing.tenantId,
      stripeSubscriptionId: subscription.id,
    };
  }

  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice,
    tx: Prisma.TransactionClient,
  ): Promise<WebhookProcessingResult> {
    const stripeSubscriptionId = extractSubscriptionIdFromInvoice(invoice);

    if (!stripeSubscriptionId) {
      logger.warn({
        msg: 'Webhook invoice success skipped — no subscription on invoice',
        invoiceId: invoice.id,
        result: 'skipped',
      });
      return { result: 'skipped' };
    }

    const stripeSubscription =
      await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const period = extractInvoicePeriod(invoice);
    const syncData = await this.buildSyncDataFromStripeSubscription(
      stripeSubscription,
    );

    if (!syncData) {
      throw new Error(
        `Unable to resolve tenant for invoice ${invoice.id} / subscription ${stripeSubscriptionId}`,
      );
    }

    await this.persistSubscriptionSync(
      {
        ...syncData,
        status: 'ACTIVE',
        currentPeriodStart: period.start ?? syncData.currentPeriodStart,
        currentPeriodEnd: period.end ?? syncData.currentPeriodEnd,
      },
      tx,
    );

    return {
      result: 'success',
      tenantId: syncData.tenantId,
      stripeSubscriptionId,
    };
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
    tx: Prisma.TransactionClient,
  ): Promise<WebhookProcessingResult> {
    const stripeSubscriptionId = extractSubscriptionIdFromInvoice(invoice);

    if (!stripeSubscriptionId) {
      logger.warn({
        msg: 'Webhook invoice failure skipped — no subscription on invoice',
        invoiceId: invoice.id,
        result: 'skipped',
      });
      return { result: 'skipped' };
    }

    const existing = await this.billingRepo.findSubscriptionByStripeSubscriptionId(
      stripeSubscriptionId,
    );

    if (existing) {
      await this.billingRepo.updateSubscriptionByStripeId(
        stripeSubscriptionId,
        { status: 'PAST_DUE' },
        tx,
      );

      return {
        result: 'success',
        tenantId: existing.tenantId,
        stripeSubscriptionId,
      };
    }

    const stripeSubscription =
      await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const syncData = await this.buildSyncDataFromStripeSubscription(
      stripeSubscription,
      undefined,
      'PAST_DUE',
    );

    if (!syncData) {
      throw new Error(
        `Unable to resolve tenant for failed invoice ${invoice.id}`,
      );
    }

    await this.persistSubscriptionSync(
      { ...syncData, status: 'PAST_DUE' },
      tx,
    );

    return {
      result: 'success',
      tenantId: syncData.tenantId,
      stripeSubscriptionId,
    };
  }

  private async buildSyncDataFromStripeSubscription(
    subscription: Stripe.Subscription,
    overrides?: {
      tenantId?: string;
      planId?: string;
      stripeCustomerId?: string | null;
    },
    statusOverride?: SubscriptionSyncData['status'],
  ): Promise<SubscriptionSyncData | null> {
    const metadata = readMetadata(subscription.metadata);
    const stripeCustomerId =
      overrides?.stripeCustomerId ??
      getStripeCustomerId(subscription.customer);

    let tenantId: string | undefined = overrides?.tenantId ?? metadata.tenantId;

    if (!tenantId && stripeCustomerId) {
      const tenant =
        await this.billingRepo.findTenantByStripeCustomerId(stripeCustomerId);
      tenantId = tenant?.id;
    }

    if (!tenantId) {
      const existing =
        await this.billingRepo.findSubscriptionByStripeSubscriptionId(
          subscription.id,
        );
      tenantId = existing?.tenantId;
    }

    if (!tenantId) {
      return null;
    }

    let planId: string | undefined = overrides?.planId ?? metadata.planId;

    if (!planId) {
      const priceId = getStripePriceId(subscription);
      if (priceId) {
        const plan = await this.billingRepo.findPlanByStripePriceId(priceId);
        planId = plan?.id;
      }
    }

    if (!planId) {
      const existing =
        await this.billingRepo.findSubscriptionByStripeSubscriptionId(
          subscription.id,
        );
      planId = existing?.planId;
    }

    if (!planId) {
      return null;
    }

    const period = extractSubscriptionPeriod(subscription);

    return {
      tenantId,
      planId,
      stripeCustomerId: stripeCustomerId ?? null,
      stripeSubscriptionId: subscription.id,
      status: statusOverride ?? mapStripeSubscriptionStatus(subscription.status),
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    };
  }

  private async persistSubscriptionSync(
    data: SubscriptionSyncData,
    tx: Prisma.TransactionClient,
  ) {
    if (data.stripeCustomerId) {
      await this.billingRepo.ensureTenantStripeCustomerId(
        data.tenantId,
        data.stripeCustomerId,
        tx,
      );
    }

    await this.billingRepo.upsertSubscriptionByTenant(
      {
        tenantId: data.tenantId,
        planId: data.planId,
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      },
      tx,
    );
  }
}
