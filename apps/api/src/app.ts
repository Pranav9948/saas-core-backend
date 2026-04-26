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

export const app: Express = express();

const viewsPath = path.join(process.cwd(), 'app', 'views');

app.post(
  '/api/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler,
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
