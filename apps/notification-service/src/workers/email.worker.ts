import { Worker } from 'bullmq';
import { emailProcessor } from '../processors/email.processor.js';
import { EmailJobData } from '../types/email.types.js';
import { logger } from '../core/logger.js';
import { redisConfig } from '../config/redis.js';

export const emailWorker = new Worker(
  'email-queue',
  async (job) => {
    try {
      const data = job.data as EmailJobData;
      logger.info(`data in email worker ${JSON.stringify(job, null, 2)}`);
      switch (job.name) {
        case 'email:RESET_PASSWORD':
          return await emailProcessor.resetPassword(
            data as Extract<EmailJobData, { type: 'RESET_PASSWORD' }>,
          );
        case 'email:INVITE_USER':
          return await emailProcessor.inviteUser(
            data as Extract<EmailJobData, { type: 'INVITE_USER' }>,
          );
        case 'email:LOGIN_ALERT':
          return await emailProcessor.loginAlert(
            data as Extract<EmailJobData, { type: 'LOGIN_ALERT' }>,
          );

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
