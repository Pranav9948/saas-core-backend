import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import routes from './routes/v1/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

export const app: Express = express();

app.use(cookieParser());
app.use(express.json());

app.use('/api/v1', routes);

app.use(errorMiddleware);
