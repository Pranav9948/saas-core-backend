import { app } from './app.js';
import { config } from '@/core/config.js';
import { logger } from '@/core/logger.js';
import { connectDB, disConnectDB } from '@/infra/db.js';
import { seedPermissions } from '@/modules/rbac/seed-permissions.js';
import { seedRolesForAllTenants } from '@/modules/rbac/rbac.seed.js';
import { syncOwnerRolePermissions } from '@/modules/rbac/sync-owner-permissions.js';
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
  } catch (error) {
    logger.error(error, '❌ Failed to start server');
    process.exit(1);
  }

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

  try {
    await seedPermissions();
    await seedRolesForAllTenants();
    await syncOwnerRolePermissions();
    registerEvents();
    logger.info(
      { service: 'api', env: config.NODE_ENV },
      `Service started in ${config.NODE_ENV} mode`,
    );
  } catch (error) {
    logger.error(
      error,
      '❌ Startup seeding failed; /health is up but the API is degraded',
    );
  }
};

start();
