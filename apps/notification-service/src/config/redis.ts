import { RedisOptions } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../core/config.js';

export const redisConfig: RedisOptions = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
};

export const redis = new IORedis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
});
