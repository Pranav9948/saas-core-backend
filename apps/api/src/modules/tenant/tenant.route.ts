import { authenticate } from '@/middlewares/auth.middleware.js';
import { Router, type Router as ExpressRouter } from 'express';
import * as tenantController from './tenant.controller.js';
import { validate } from '@/middlewares/validate.middleware.js';
import {
  AcceptInviteSchema,
  InviteUserSchema,
  UpdateTenantSchema,
} from './tenant.schema.js';
import { uploadLogo } from '@/middlewares/upload.middleware.js';
import { PERMISSIONS } from '../rbac/permissions.constants.js';
import { authorizePermissions } from '@/middlewares/permission.middleware.js';

const router: ExpressRouter = Router();

router.get(
  '/',
  authenticate,
  authorizePermissions(PERMISSIONS.TENANT_VIEW),
  tenantController.getCurrentTenant,
);

router.patch(
  '/',
  authenticate,
  authorizePermissions(PERMISSIONS.TENANT_UPDATE),
  validate(UpdateTenantSchema),
  tenantController.updateTenant,
);

router.post(
  '/logo',
  authenticate,
  authorizePermissions(PERMISSIONS.TENANT_UPDATE),
  uploadLogo.single('logo'),
  tenantController.uploadGymLogo,
);

router.post(
  '/users/invite',
  authenticate,
  authorizePermissions(PERMISSIONS.TENANT_UPDATE),
  validate(InviteUserSchema),
  tenantController.inviteUser,
);

router.post(
  '/users/accept-invite',
  authenticate,
  authorizePermissions(PERMISSIONS.TENANT_UPDATE),
  validate(AcceptInviteSchema),
  tenantController.acceptInvite,
);

router.post(
  '/users',
  authenticate,
  authorizePermissions(PERMISSIONS.TENANT_UPDATE),
  validate(InviteUserSchema),
  tenantController.createUserDirect,
);

export default router;
