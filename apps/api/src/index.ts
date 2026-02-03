import express from 'express';
import { config } from '@/core/config.js';
import { logger } from '@/core/logger.js';
import { connectDB } from '@/infra/db.js';
import * as UserController from '@/modules/user/user.controller.js';

const app = express();
app.use(express.json());


// Routes
app.post('/users', UserController.handleCreateUser);
app.get('/users/:id', UserController.handleGetUser);

const start = async () => {
  await connectDB();
  // Adding '0.0.0.0' is the secret sauce for Docker
  app.listen(config.PORT, '0.0.0.0', () => {
    logger.info(`🚀 Server running on http://0.0.0.0:${config.PORT}`);
  });
};

start();