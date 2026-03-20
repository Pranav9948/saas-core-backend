import { Router, type Router as ExpressRouter } from 'express';
import * as trainerController from './trainer.controller.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { authenticate } from '@/middlewares/auth.middleware.js';
import {
  CreateTrainerSchema,
  GetTrainerIDSchema,
  UpdateTrainerSchema,
} from './trainer.schema.js';
import { authorizePermissions } from '@/middlewares/permission.middleware.js';
import { PERMISSIONS } from '../rbac/permissions.constants.js';

const router: ExpressRouter = Router();

router.use(authenticate);

router.post(
  '/',
  authorizePermissions(PERMISSIONS.TRAINER_CREATE),
  validate(CreateTrainerSchema),
  trainerController.createTrainer,
);

router.get(
  '/',
  authorizePermissions(PERMISSIONS.TRAINER_VIEW),
  trainerController.listTrainers,
);

router.get(
  '/:id',
  authorizePermissions(PERMISSIONS.TRAINER_VIEW),
  validate(GetTrainerIDSchema),
  trainerController.getTrainer,
);

router.patch(
  '/:id',
  authorizePermissions(PERMISSIONS.TRAINER_UPDATE),
  validate(UpdateTrainerSchema),
  trainerController.updateTrainer,
);

router.delete(
  '/:id',
  authorizePermissions(PERMISSIONS.TRAINER_DELETE),
  validate(GetTrainerIDSchema),
  trainerController.deleteTrainer,
);

router.get(
  '/:id/members',
  authorizePermissions(PERMISSIONS.TRAINER_VIEW),
  validate(GetTrainerIDSchema),
  trainerController.getTrainerMembers,
);

export default router;
