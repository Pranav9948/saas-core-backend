import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { defaultJobOptions } from '../config/queue-defaults.js';

export const stripeQueue = new Queue('stripe-queue', {
  connection: redisConfig,
  defaultJobOptions,
});
