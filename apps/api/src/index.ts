import express from 'express';
import { config } from '@/core/config.js';
import { logger } from '@/core/logger.js';
import { connectDB, prisma } from '@/infra/db.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import routes from './api/routes.js';
import cookieParser from 'cookie-parser';

// Global process guards to prevent silent crashes

process.on('unhandledRejection', (reason) => {
  logger.error(`🔥 Unhandled Rejection: ${reason}`);
  throw reason;
});

process.on('uncaughtException', (error) => {
  logger.error(`🔥 Uncaught Exception: ${error.message}`);
  process.exit(1);
});

const app = express();
app.use(cookieParser());
app.use(express.json());

// Routes

app.use('/api', routes);

app.use(errorMiddleware);

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
