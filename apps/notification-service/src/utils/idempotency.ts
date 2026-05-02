import { redis, redisConfig } from '../config/redis';

export const isAlreadyProcessed = async (key: string) => {
  const exists = await redis.get(key);
  return !!exists;
};

export const markAsProcessed = async (key: string) => {
  await redis.set(key, '1', 'EX', 3600);
};
