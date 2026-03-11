import { authenticate } from '@/middlewares/auth.middleware.js';
import { Router, type Router as ExpressRouter } from 'express';
import * as tenantController from './tenant.controller.js';
import { authorizeRoles } from '@/middlewares/role.middleware.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { UpdateTenantSchema } from './tenant.schema.js';

const router: ExpressRouter = Router();

router.get('/', authenticate, tenantController.getCurrentTenant);

router.patch(
  '/',
  authenticate,
  authorizeRoles('OWNER', 'ADMIN'),
  validate(UpdateTenantSchema),
  tenantController.updateTenant,
);

export default router;
