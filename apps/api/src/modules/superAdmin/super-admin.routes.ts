import { validate } from './../../middlewares/validate.middleware.js';
import { Router, type Router as ExpressRouter } from 'express';
import { superAdminAuthController } from './super-admin.controller.js';
import {
  CreatePlanSchema,
  PlanIdSchema,
  superAdminCreationSchema,
  superAdminLoginSchema,
  UpdatePlanSchema,
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

router.post(
  '/create-plan',
  authenticateSuperAdmin,
  requireSuperAdmin,
  validate(CreatePlanSchema),
  superAdminAuthController.createPlan,
);

router.get('/get-all-plans', superAdminAuthController.getAllPlans);

router.patch(
  '/update-plan/:id',
  authenticateSuperAdmin,
  requireSuperAdmin,
  validate(UpdatePlanSchema),
  superAdminAuthController.updatePlan,
);

router.delete(
  '/delete-plan/:id',
  authenticateSuperAdmin,
  requireSuperAdmin,
  validate(PlanIdSchema),
  superAdminAuthController.deletePlan,
);

export default router;
