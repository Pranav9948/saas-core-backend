import { app } from './app.js';
import { config } from '@/core/config.js';
import { logger } from '@/core/logger.js';
import { connectDB } from '@/infra/db.js';

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

    app.listen(config.PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on http://0.0.0.0:${config.PORT}`);
    });
  } catch (error) {
    logger.error(error, '❌ Failed to start server');
    process.exit(1);
  }
};

start();
