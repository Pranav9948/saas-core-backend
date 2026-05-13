import { Router, type Router as ExpressRouter } from 'express';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { createGoal, getGoals } from './goal.controller.js';
import { CreateGoalSchema, MemberGoalParamSchema } from './goal.schema.js';
import { authorizePermissions } from '@/middlewares/permission.middleware.js';
import { PERMISSIONS } from '@/modules/rbac/permissions.constants.js';

const router: ExpressRouter = Router();

router.post(
  '/:memberId',
  authenticate,
  authorizePermissions(PERMISSIONS.GOAL_CREATE),
  validate(CreateGoalSchema),
  createGoal,
);

router.get(
  '/:memberId',
  authenticate,
  validate(MemberGoalParamSchema),
  getGoals,
);

export default router;
