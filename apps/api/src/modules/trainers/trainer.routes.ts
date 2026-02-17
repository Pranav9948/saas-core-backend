import { Router, type Router as ExpressRouter } from 'express';
import * as trainerController from './trainer.controller.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { authorizeRoles } from '@/middlewares/role.middleware.js';
import {
  CreateTrainerSchema,
  GetTrainerIDSchema,
  UpdateTrainerSchema,
} from './trainer.schema.js';

const router: ExpressRouter = Router();

router.use(authenticate);

router.post(
  '/',
  authorizeRoles('ADMIN'),
  validate(CreateTrainerSchema),
  trainerController.createTrainer,
);

router.get(
  '/',
  authorizeRoles('ADMIN', 'STAFF'),
  trainerController.listTrainers,
);

router.get('/:id', validate(GetTrainerIDSchema), trainerController.getTrainer);

router.patch(
  '/:id',
  authorizeRoles('ADMIN'),
  validate(UpdateTrainerSchema),
  trainerController.updateTrainer,
);

router.delete(
  '/:id',
  authorizeRoles('ADMIN'),
  validate(GetTrainerIDSchema),
  trainerController.deleteTrainer,
);

router.get(
  '/:id/members',
  authorizeRoles('ADMIN', 'STAFF'),
  validate(GetTrainerIDSchema),
  trainerController.getTrainerMembers,
);

export default router;
