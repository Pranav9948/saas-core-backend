import { stripe } from '@/modules/billing/stripe.service.js';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { config } from '@/core/config.js';
import { logger } from '@/core/logger.js';
import { enqueueStripeEvent } from '@/modules/jobs/producers/stripe.producer.js';

export const webhookHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  if (!sig || typeof sig !== 'string') {
    logger.error({ msg: 'Stripe webhook rejected — missing signature' });
    res.status(400).send('Missing signature');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.STRIPE_WEBHOOK_SECRET,
    );

    logger.info({
      msg: 'Stripe webhook verified',
      eventId: event.id,
      eventType: event.type,
    });
  } catch (err: unknown) {
    logger.error({
      msg: 'Stripe webhook signature verification failed',
      err: err instanceof Error ? err.message : String(err),
    });
    res.status(400).send('Webhook signature verification failed');
    return;
  }

  try {
    await enqueueStripeEvent(event);

    logger.info({
      msg: 'Stripe webhook enqueued',
      eventId: event.id,
      eventType: event.type,
    });

    res.status(200).json({ received: true });
  } catch (err: unknown) {
    logger.error({
      msg: 'Stripe webhook enqueue failed',
      eventId: event.id,
      eventType: event.type,
      err: err instanceof Error ? err.message : String(err),
    });
    res.status(500).send('Webhook handler failed');
  }
};
