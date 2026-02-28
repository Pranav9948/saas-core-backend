import pino from 'pino';
import { config } from '@/core/config.js';

const isDevLike = ['development', 'test'].includes(config.NODE_ENV);

export const logger = pino({
  level: config.LOG_LEVEL,
  transport: isDevLike
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss Z',
        },
      }
    : undefined,
});
