import { Worker } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { analyticsProcessor } from '../processors/analytics.processor.js';
import { logger } from '../../../core/logger.js';

export const analyticsWorker = new Worker(
  'analytics-queue',
  async (job) => {
    try {
      switch (job.name) {
        case 'daily-attendance-analytics':
          return await analyticsProcessor.process(job.data);

        default:
          throw new Error(`Unknown job: ${job.name}`);
      }
    } catch (error) {
      logger.error(
        {
          jobId: job.id,
          err: error instanceof Error ? error.message : error,
        },
        '❌ Analytics job failed',
      );
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
  logger.error(
    {
      jobId: job?.id,
      attempts: job?.attemptsMade,
      err: err.message,
    },
    '💀 Analytics job failed permanently',
  );
});
