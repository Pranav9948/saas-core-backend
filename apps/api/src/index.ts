import { app } from './app.js';
import { config } from '@/core/config.js';
import { logger } from '@/core/logger.js';
import { connectDB, disConnectDB } from '@/infra/db.js';
import { redis } from '@/infra/redis.js';
import { registerEvents } from '@/modules/events/register.js';
import { registerGracefulShutdown } from '@saas/core';
import type { Server } from 'node:http';

// Global process guards
process.on('unhandledRejection', (reason) => {
  logger.error(`🔥 Unhandled Rejection: ${reason}`);
  throw reason;
});

process.on('uncaughtException', (error) => {
  logger.error(`🔥 Uncaught Exception: ${error.message}`);
  process.exit(1);
});

const start = async () => {
  try {
    await connectDB();
    registerEvents();
    logger.info(
      { service: 'api', env: config.NODE_ENV },
      `Service started in ${config.NODE_ENV} mode`,
    );

    const server: Server = app.listen(config.PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on http://0.0.0.0:${config.PORT}`);
    });

    registerGracefulShutdown({
      serviceName: 'api',
      logger,
      handlers: [
        async () => {
          await new Promise<void>((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
          });
        },
        async () => {
          redis.disconnect();
        },
        async () => {
          await disConnectDB();
        },
      ],
    });
  } catch (error) {
    logger.error(error, '❌ Failed to start server');
    process.exit(1);
  }
};

start();
