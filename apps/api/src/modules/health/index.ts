import { Router } from 'express';
import * as healthController from './health.controller.js';
import type { Router as ExpressRouter } from 'express';

const router: ExpressRouter = Router();

router.get('/', healthController.check);

export default router;
