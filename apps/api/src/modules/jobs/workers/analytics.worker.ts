import { Worker } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { analyticsProcessor } from '../processors/analytics.processor.js';
import { logger } from '../../../core/logger.js';

export const analyticsWorker = new Worker(
  'analytics-queue',
  async (job) => {
    const startTime = Date.now();

    logger.info({
      msg: 'Job started',
      queue: 'analytics-queue',
      jobId: job.id,
      jobName: job.name,
    });

    try {
      let result;

      switch (job.name) {
        case 'daily-attendance-analytics':
          result = await analyticsProcessor.process(job.data);
          break;

        default:
          throw new Error(`Unknown job: ${job.name}`);
      }

      const duration = Date.now() - startTime;

      logger.info({
        msg: 'Job completed',
        queue: 'analytics-queue',
        jobId: job.id,
        jobName: job.name,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error({
        msg: 'Job failed',
        queue: 'analytics-queue',
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
    concurrency: 2,
  },
);

// failure logging

analyticsWorker.on('failed', (job, err) => {
  logger.error({
    msg: 'Job permanently failed',
    queue: 'analytics-queue',
    jobId: job?.id,
    jobName: job?.name,
    attempts: job?.attemptsMade,
    err: err.message,
  });
});
