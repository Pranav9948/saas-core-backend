import { registerGracefulShutdown } from '@saas/core';
import { logger } from './core/logger.js';
import { config } from './core/config.js';
import { startHealthServer } from './health/server.js';
import { emailWorker } from './workers/email.worker.js';
import { redis } from './config/redis.js';

logger.info(
  { service: 'notification-service', env: config.NODE_ENV },
  `Service started in ${config.NODE_ENV} mode`,
);

const health = startHealthServer();

registerGracefulShutdown({
  serviceName: 'notification-service',
  logger,
  handlers: [
    async () => {
      await health.close();
    },
    async () => {
      await emailWorker.close();
    },
    async () => {
      redis.disconnect();
    },
  ],
});

