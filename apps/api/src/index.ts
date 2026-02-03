import express from 'express';
import { config } from '@/core/config.js';
import { logger } from '@/core/logger.js';
import { connectDB, prisma } from '@/infra/db.js';
import { errorMiddleware } from './middlewares/error.js';
import { errorHandler } from './utils/error-handler.js';
import { ErrorCode } from './exceptions/root.js';
import { BadRequestException } from './exceptions/bad-request.js';
import { Request, Response } from 'express';

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
app.use(express.json());

// Routes

app.get(
  '/health',
  errorHandler(async (_req: Request, res: Response) => {
    // 1. Check Database Connection
    await prisma.$queryRaw`SELECT 1`;

    // 2. Return System Info
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      version: '1.0.0',
    });
  }),
);

app.get(
  '/test-error',
  errorHandler(async (_req: Request, _res: Response) => {
    throw new BadRequestException(
      'This is a planned error',
      ErrorCode.VALIDATION_FAILED,
    );
  }),
);

app.get(
  '/hello',
  errorHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'hello',
      timestamp: new Date().toISOString(),
    });
  }),
);

app.get(
  '/run',
  errorHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'run',
      timestamp: new Date().toISOString(),
    });
  }),
);

app.get(
  '/jump',
  errorHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'jump',
      timestamp: new Date().toISOString(),
    });
  }),
);

app.get(
  '/sleep',
  errorHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'sleep',
      timestamp: new Date().toISOString(),
    });
  }),
);

app.get(
  '/eat',
  errorHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'eat',
      timestamp: new Date().toISOString(),
    });
  }),
);

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
