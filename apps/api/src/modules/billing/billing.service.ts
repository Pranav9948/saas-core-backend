import { BillingInterval, PlanName } from '@/generated/prisma/enums.js';
import { BillingRepository } from './billing.repository.js';
import { stripe } from './stripe.service.js';
import { BadRequestException } from '@/exceptions/exceptions.js';
import Stripe from 'stripe';
import { prisma } from '@/infra/db.js';
import { logger } from '@/core/logger.js';
import { json } from 'zod';

export class BillingService {
  constructor(private billingRepo = new BillingRepository()) {}

  async createCheckoutSession(tenantId: string, planId: string) {
    
    const tenant = await this.billingRepo.getTenantWithSubscription(tenantId);

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const planDetails = await this.billingRepo.getPlanById(planId);

    if (!planDetails) {
      throw new BadRequestException('Invalid plan or interval');
    }

    if (!planDetails.stripePriceId) {
      throw new BadRequestException(
        'Stripe price ID not configured for this plan',
      );
    }

    if (!tenant.stripeCustomerId) {
      throw new BadRequestException('Stripe customer not found for tenant');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',

      customer: tenant.stripeCustomerId,

      line_items: [
        {
          price: planDetails.stripePriceId,
          quantity: 1,
        },
      ],

      success_url: `${process.env.FRONTEND_URL}/api/v1/billing/success`,
      cancel_url: `${process.env.FRONTEND_URL}/api/v1/billing/cancel`,

      metadata: {
        tenantId,
        planId: planDetails.id,
        planName: planDetails.name,
        interval: planDetails.interval,
      },
    });

    logger.debug(`session details ${JSON.stringify(session, null, 2)}`);

    if (!session.url) {
      throw new Error('Failed to create checkout session');
    }

    return session.url;
  }

  async handleEvent(event: Stripe.Event) {
    logger.info({
      msg: '⚡ Processing event',
      type: event.type,
      id: event.id,
      // event: JSON.stringify(event, null, 2),
    });

    const exists = await prisma.stripeEvent.findUnique({
      where: { id: event.id },
    });

    if (exists) {
      logger.warn({
        msg: '⚠️ Duplicate event skipped',
        eventId: event.id,
      });
      return;
    }

    await prisma.stripeEvent.create({
      data: {
        id: event.id,
        type: event.type,
      },
    });

    const eventType = event.type as string;

    switch (eventType) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as any);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as any);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as any);
        break;

      case 'invoice_payment.paid':
        logger.warn('⚠️ Skipping invoice_payment.paid (not reliable)');
        break;

      case 'invoice_payment.failed':
        logger.warn('⚠️ Skipping invoice_payment.failed (not reliable)');
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as any);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.created':
        logger.debug('Ignoring subscription.created for billing period');
        break;

      default:
        logger.debug({ msg: 'Unhandled event', type: event.type });
    }
  }

  async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const tenantId = session.metadata?.tenantId;
    const planId = session.metadata?.planId;

    if (!tenantId || !planId) {
      throw new Error('Missing metadata');
    }

    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    logger.info({
      msg: '🧾 Checkout completed',
      session,
    });

    await prisma.subscription.upsert({
      where: { tenantId },
      update: {
        planId,
        stripeCustomerId,
        stripeSubscriptionId,
        status: 'INCOMPLETE',
      },
      create: {
        tenantId,
        planId,
        stripeCustomerId,
        stripeSubscriptionId,
        status: 'INCOMPLETE',
      },
    });
  }

  async handleInvoicePaymentSucceeded(invoice: any) {
    logger.info({
      msg: '💰 Processing invoice.payment_succeeded',
      invoiceId: invoice.id,
    });

    // ✅ Extract subscription ID properly (Stripe changed structure)
    const stripeSubscriptionId =
      invoice.subscription ||
      invoice.parent?.subscription_details?.subscription ||
      invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;

    if (!stripeSubscriptionId) {
      logger.error({
        msg: '❌ Subscription ID not found anywhere in invoice',
        invoiceId: invoice.id,
      });
      return;
    }

    // ✅ Extract billing period directly from invoice
    const periodStart =
      invoice.lines?.data?.[0]?.period?.start || invoice.period_start;

    const periodEnd =
      invoice.lines?.data?.[0]?.period?.end || invoice.period_end;

    await prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: periodStart
          ? new Date(periodStart * 1000)
          : undefined,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
      },
    });

    logger.info({
      msg: '✅ Payment succeeded → status ACTIVE + period stored',
      stripeSubscriptionId,
    });
  }

  async handlePaymentFailed(payment: any) {
    logger.warn({
      msg: '🔴 Processing invoice_payment.failed',
      paymentId: payment.id,
    });

    const invoiceId = payment.invoice;

    if (!invoiceId) return;

    const invoice = (await stripe.invoices.retrieve(invoiceId)) as any;

    const stripeSubscriptionId =
      invoice.subscription ||
      invoice.parent?.subscription_details?.subscription ||
      invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;

    if (!stripeSubscriptionId) return;

    await prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        status: 'PAST_DUE',
      },
    });

    logger.error({
      msg: '❌ Subscription marked PAST_DUE',
      stripeSubscriptionId,
    });
  }

  async handleSubscriptionDeleted(sub: Stripe.Subscription) {
    logger.warn({
      msg: '🛑 START: customer.subscription.deleted',
      sub: sub,
    });

    await prisma.subscription.update({
      where: { stripeSubscriptionId: sub.id },
      data: {
        status: 'CANCELED',
      },
    });

    logger.warn({
      msg: '🛑 END: customer.subscription.deleted',
      stripeSubscriptionId: sub.id,
    });
  }

  async getSubscriptionWithRetry(subscriptionId: string, retries = 3) {
    for (let i = 0; i < retries; i++) {
      const sub = (await stripe.subscriptions.retrieve(subscriptionId)) as any;

      if (sub.current_period_start && sub.current_period_end) {
        return sub;
      }

      logger.warn({
        msg: '⏳ Subscription not ready, retrying...',
        attempt: i + 1,
      });

      await new Promise((res) => setTimeout(res, 1500)); // wait 1.5 sec
    }

    return null;
  }

  async handleSubscriptionUpdated(sub: any) {
    logger.info({
      msg: '🔄 Subscription updated event',
      subId: sub.id,
    });

    const item = sub.items?.data?.[0];

    const start = item?.current_period_start;
    const end = item?.current_period_end;

    if (!start || !end) {
      logger.debug('Ignoring subscription event (no period yet)');
      return;
    }

    await prisma.subscription.update({
      where: { stripeSubscriptionId: sub.id },
      data: {
        status: sub.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
        currentPeriodStart: new Date(start * 1000),
        currentPeriodEnd: new Date(end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });

    logger.info({
      msg: '✅ Billing period stored from subscription event',
      subId: sub.id,
    });
  }
}
