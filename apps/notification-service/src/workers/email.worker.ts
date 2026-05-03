import { Worker } from 'bullmq';
import { emailProcessor } from '../processors/email/email.processor.js';
import { EmailJobData } from '../types/email.types.js';
import { logger } from '../core/logger.js';
import { redisConfig } from '../config/redis.js';
import { notificationRouter } from '../routers/notification.router.js';

export const emailWorker = new Worker(
  'email-queue',
  async (job) => {
    const startTime = Date.now();

    logger.info({
      msg: 'Job started',
      queue: 'email-queue',
      jobId: job.id,
      jobName: job.name,
    });

    try {
      const result = await notificationRouter(job);
      const duration = Date.now() - startTime;
      logger.info({
        msg: 'Job completed',
        queue: 'email-queue',
        jobId: job.id,
        jobName: job.name,
        duration: `${duration}ms`,
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error({
        msg: 'Job failed',
        queue: 'email-queue',
        jobId: job.id,
        jobName: job.name,
        duration: `${duration}ms`,
        err: error instanceof Error ? error.message : error,
      });
      throw error;
    }
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
