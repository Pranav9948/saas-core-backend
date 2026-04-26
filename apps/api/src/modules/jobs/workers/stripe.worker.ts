import { Worker } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { logger } from '@/core/logger.js';
import { stripeProcessor } from '../processors/stripe.processor.js';

export const stripeWorker = new Worker(
  'stripe-queue',
  async (job) => {
    try {
      switch (job.name) {
        case 'process-stripe-event':
          logger.info(`calling stripe worker process-stripe-event`);
          return await stripeProcessor.process(job.data);

        default:
          throw new Error(`Unknown job: ${job.name}`);
      }
    } catch (error) {
      logger.error(
        {
          jobId: job.id,
          err: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
        },
        '❌ Stripe job failed',
      );
      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 5,
  },
);

stripeWorker.on('failed', (job, err) => {
  logger.error(
    {
      jobId: job?.id,
      name: job?.name,
      attemptsMade: job?.attemptsMade,
      err: err.message,
    },
    ' Job moved to failed state',
  );
});
