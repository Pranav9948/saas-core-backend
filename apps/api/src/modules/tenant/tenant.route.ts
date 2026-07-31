import { authenticate } from '@/middlewares/auth.middleware.js';
import { Router, type Router as ExpressRouter } from 'express';
import * as tenantController from './tenant.controller.js';
import { validate } from '@/middlewares/validate.middleware.js';
import {
  AcceptInviteSchema,
  InviteIdParamSchema,
  InvitePreviewQuerySchema,
  InviteUserSchema,
  directCreateUserSchema,
  UpdateTenantSchema,
  upgradePlanSchema,
} from './tenant.schema.js';
import { uploadLogo } from '@/middlewares/upload.middleware.js';
import { PERMISSIONS } from '../rbac/permissions.constants.js';
import { authorizePermissions } from '@/middlewares/permission.middleware.js';

const router: ExpressRouter = Router();

router.get(
  '/users/invites/preview',
  validate(InvitePreviewQuerySchema),
  tenantController.getInvitePreview,
);

router.post(
  '/users/accept-invite',
  validate(AcceptInviteSchema),
  tenantController.acceptInvite,
);

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

router.get(
  '/users',
  authenticate,
  authorizePermissions(PERMISSIONS.USER_INVITE),
  tenantController.listTeamMembers,
);

router.get(
  '/users/invites',
  authenticate,
  authorizePermissions(PERMISSIONS.USER_INVITE),
  tenantController.listPendingInvites,
);

router.delete(
  '/users/invites/:id',
  authenticate,
  authorizePermissions(PERMISSIONS.USER_INVITE),
  validate(InviteIdParamSchema),
  tenantController.cancelInvite,
);

router.post(
  '/users/invite',
  authenticate,
  authorizePermissions(PERMISSIONS.USER_INVITE),
  validate(InviteUserSchema),
  tenantController.inviteUser,
);

router.post(
  '/users',
  authenticate,
  authorizePermissions(PERMISSIONS.USER_INVITE),
  validate(directCreateUserSchema),
  tenantController.createUserDirect,
);

router.patch(
  '/upgrade-plan',
  authenticate,
  authorizePermissions(PERMISSIONS.TENANT_UPDATE),
  validate(upgradePlanSchema),
  tenantController.upgradeTenantPlan,
);

export default router;
