import { stripeQueue } from '../queues/stripe.queue.js';

export const enqueueStripeEvent = async (event: any) => {
  await stripeQueue.add('process-stripe-event', event, {
    jobId: `stripe-${event.id}`,
  });
};
