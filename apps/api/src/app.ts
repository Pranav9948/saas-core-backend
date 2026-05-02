import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import routes from './routes/v1/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { NotFoundException } from './exceptions/exceptions.js';
import { ErrorCode } from './exceptions/root.js';
import { engine } from 'express-handlebars';
import path from 'path';
import { stripe } from './modules/billing/stripe.service.js';
import { webhookHandler } from './utils/webhookHandler.js';
import { startAnalyticsCron } from './modules/jobs/schedulers/analytics.scheduler.js';
import { setupBullBoard } from './core/bull-board.js';
import rateLimit from 'express-rate-limit';
import { prisma } from './infra/db.js';
import { redis } from './infra/redis.js';

export const app: Express = express();
const bullBoard = setupBullBoard();

const viewsPath = path.join(process.cwd(), 'app', 'views');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 20, // 20 requests per minute per IP
});

app.post(
  '/api/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler,
);

app.get('/health', async (_req, res) => {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();

  let dbOk = false;
  let redisOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  try {
    const pong = await redis.ping();
    redisOk = pong === 'PONG';
  } catch {
    redisOk = false;
  }

  const status = dbOk && redisOk ? 'ok' : 'degraded';
  res.status(status === 'ok' ? 200 : 503).json({
    status,
    service: 'api',
    timestamp,
    uptime,
    dependencies: {
      database: dbOk ? 'connected' : 'disconnected',
      redis: redisOk ? 'connected' : 'disconnected',
    },
  });
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/admin/queues', bullBoard.getRouter());

startAnalyticsCron();

app.engine(
  'hbs',
  engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(viewsPath, 'layouts'),
  }),
);

app.set('view engine', 'hbs');

app.set('views', viewsPath);
app.use('/api', limiter);

app.use('/api/v1', routes);

app.all('{*path}', (req, _res, next) => {
  next(
    new NotFoundException(
      `Route ${req.originalUrl} not found`,
      ErrorCode.NOT_FOUND,
    ),
  );
});

app.use(errorMiddleware);
