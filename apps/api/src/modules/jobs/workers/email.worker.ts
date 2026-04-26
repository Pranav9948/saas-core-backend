import { Worker } from 'bullmq';
import { emailProcessor } from '../processors/email.processor.js';
import { redisConfig } from '../config/redis.js';
import { logger } from '../../../core/logger.js';

export const emailWorker = new Worker(
  'email-queue',
  async (job) => {
    try {
      switch (job.name) {
        case 'send-email':
          return await emailProcessor.send(job.data);

        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      logger.error(
        {
          jobId: job.id,
          err: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          data: job.data,
        },
        '❌ Email job failed',
      );
      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 5,
  },
);
