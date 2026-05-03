import { Worker } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { logger } from '@/core/logger.js';
import { stripeProcessor } from '../processors/stripe.processor.js';

export const stripeWorker = new Worker(
  'stripe-queue',
  async (job) => {
    const startTime = Date.now();

    logger.info({
      msg: 'Job started',
      queue: 'stripe-queue',
      jobId: job.id,
      jobName: job.name,
    });

    try {
      switch (job.name) {
        case 'process-stripe-event': {
          const result = await stripeProcessor.process(job.data);
          const duration = Date.now() - startTime;
          logger.info({
            msg: 'Job completed',
            queue: 'stripe-queue',
            jobId: job.id,
            jobName: job.name,
            duration: `${duration}ms`,
          });
          return result;
        }

        default:
          throw new Error(`Unknown job: ${job.name}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error({
        msg: 'Job failed',
        queue: 'stripe-queue',
        jobId: job.id,
        jobName: job.name,
        duration: `${duration}ms`,
        err: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
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
