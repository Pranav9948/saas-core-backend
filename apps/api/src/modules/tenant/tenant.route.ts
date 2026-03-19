import { authenticate } from '@/middlewares/auth.middleware.js';
import { Router, type Router as ExpressRouter } from 'express';
import * as tenantController from './tenant.controller.js';
import { authorizeRoles } from '@/middlewares/role.middleware.js';
import { validate } from '@/middlewares/validate.middleware.js';
import {
  AcceptInviteSchema,
  InviteUserSchema,
  UpdateTenantSchema,
} from './tenant.schema.js';
import { uploadLogo } from '@/middlewares/upload.middleware.js';

const router: ExpressRouter = Router();

router.get('/', authenticate, tenantController.getCurrentTenant);

router.patch(
  '/',
  authenticate,
  authorizeRoles('OWNER', 'ADMIN'),
  validate(UpdateTenantSchema),
  tenantController.updateTenant,
);

router.post(
  '/logo',
  authenticate,
  authorizeRoles('OWNER', 'ADMIN'),
  uploadLogo.single('logo'),
  tenantController.uploadGymLogo,
);

router.post(
  '/users/invite',
  authenticate,
  authorizeRoles('OWNER', 'ADMIN'),
  validate(InviteUserSchema),
  tenantController.inviteUser,
);

router.post(
  '/users/accept-invite',
  authenticate,
  authorizeRoles('OWNER', 'ADMIN'),
  validate(AcceptInviteSchema),
  tenantController.acceptInvite,
);

router.post(
  '/users',
  authenticate,
  authorizeRoles('OWNER', 'ADMIN'),
  validate(InviteUserSchema),
  tenantController.createUserDirect,
);

export default router;
