import { Router, type Router as ExpressRouter } from 'express';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { authorizePermissions } from '@/middlewares/permission.middleware.js';
import { PERMISSIONS } from './permissions.constants.js';
import * as rbacController from './rbac.controller.js';

const router: ExpressRouter = Router();

router.get(
  '/',
  authenticate,
  authorizePermissions(PERMISSIONS.ROLE_VIEW),
  rbacController.listPermissions,
);

export default router;
