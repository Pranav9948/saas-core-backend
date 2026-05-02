import { Redis } from 'ioredis';
import { config } from '@/core/config.js';

export const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

