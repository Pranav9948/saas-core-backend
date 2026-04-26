import { stripe } from '@/modules/billing/stripe.service.js';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '@/infra/db.js';
import { BillingService } from '@/modules/billing/billing.service.js';
import { logger } from '@/core/logger.js';
import { enqueueStripeEvent } from '@/modules/jobs/producers/stripe.producer.js';

const billingService = new BillingService();

export const webhookHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const sig = req.headers['stripe-signature'];
  logger.info('📩 Incoming Stripe webhook');

  if (!sig || typeof sig !== 'string') {
    logger.error('❌ Missing Stripe signature');
    res.status(400).send('Missing signature');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );

    logger.info({
      msg: '✅ Webhook verified',
      eventId: event.id,
      type: event.type,
      event: JSON.stringify(event, null, 2),
    });
  } catch (err: any) {
    logger.error({
      msg: '❌ Signature verification failed',
      error: err.message,
    });
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    logger.debug({
      msg: '📦 Event payload snapshot',
      type: event.type,
      object: event.data.object?.object,
    });

    await enqueueStripeEvent(event);

    logger.info({
      msg: '✅ Event processed successfully',
      eventId: event.id,
      type: event.type,
    });

    res.status(200).json({ received: true });
    return;
  } catch (err: any) {
    logger.error({
      msg: '❌ Error handling event',
      eventId: event.id,
      type: event.type,
      error: err.message,
    });
    res.status(500).send('Webhook handler failed');
    return;
  }
};
