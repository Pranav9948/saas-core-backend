import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import routes from './routes/v1/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { NotFoundException } from './exceptions/exceptions.js';
import { ErrorCode } from './exceptions/root.js';

export const app: Express = express();

app.use(cookieParser());
app.use(express.json());

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
