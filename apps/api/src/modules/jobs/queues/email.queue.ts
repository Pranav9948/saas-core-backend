import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { defaultJobOptions } from '../config/queue-defaults.js';

export const emailQueue = new Queue('email-queue', {
  connection: redisConfig,
  defaultJobOptions,
});
