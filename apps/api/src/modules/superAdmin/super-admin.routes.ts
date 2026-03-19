import { validate } from './../../middlewares/validate.middleware.js';
import { Router, type Router as ExpressRouter } from 'express';
import { superAdminAuthController } from './super-admin.controller.js';
import {
  superAdminCreationSchema,
  superAdminLoginSchema,
} from './super-admin.schema.js';
import {
  authenticateSuperAdmin,
  requireSuperAdmin,
} from '@/middlewares/super-admin-auth.middleware.js';

const router: ExpressRouter = Router();

router.post(
  '/setup',
  validate(superAdminCreationSchema),
  superAdminAuthController.createInitialSuperAdmin,
);
router.post(
  '/login',
  validate(superAdminLoginSchema),
  superAdminAuthController.login,
);
router.get(
  '/rotate-refresh-token',
  superAdminAuthController.rotateRefreshToken,
);
router.post(
  '/logout',
  authenticateSuperAdmin,
  requireSuperAdmin,
  superAdminAuthController.logout,
);

router.get(
  '/get-all-owners-with-gyms',
  authenticateSuperAdmin,
  requireSuperAdmin,
  superAdminAuthController.getAllOwnersWithGyms,
);

export default router;
