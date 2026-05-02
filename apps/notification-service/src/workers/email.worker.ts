import { Worker } from 'bullmq';
import { emailProcessor } from '../processors/email/email.processor.js';
import { EmailJobData } from '../types/email.types.js';
import { logger } from '../core/logger.js';
import { redisConfig } from '../config/redis.js';
import { notificationRouter } from '../routers/notification.router.js';

export const emailWorker = new Worker(
  'email-queue',
  async (job) => {
    return notificationRouter(job);
  },
  {
    connection: redisConfig,
    concurrency: 10,

    limiter: {
      max: 5,
      duration: 1000,
    },
  },
);

emailWorker.on('completed', (job) => {
  logger.info(
    {
      jobId: job.id,
      jobName: job.name,
    },
    'Worker completed event',
  );
});

emailWorker.on('failed', (job, err) => {
  if (
    job &&
    job.attemptsMade !== undefined &&
    job.opts.attempts &&
    job.attemptsMade >= job.opts.attempts
  ) {
    logger.error(
      {
        jobId: job?.id,
        type: job?.name,
        attempts: job?.attemptsMade,
        error: err.message,
      },
      'Job permanently failed',
    );
  }

  logger.error(
    {
      jobId: job?.id,
      jobName: job?.name,
      attempts: job?.attemptsMade,
      error: err.message,
    },
    'Worker failed event',
  );
});
