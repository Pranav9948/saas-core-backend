import { RedisOptions } from 'bullmq';
import { config } from '../core/config';

export const redisConfig: RedisOptions = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
};
