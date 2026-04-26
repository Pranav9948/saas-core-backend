import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { defaultJobOptions } from '../config/queue-defaults.js';

export const analyticsQueue = new Queue('analytics-queue', {
  connection: redisConfig,
  defaultJobOptions,
});
