import { Router, type Router as ExpressRouter } from 'express';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { authorizePermissions } from '@/middlewares/permission.middleware.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { PERMISSIONS } from './permissions.constants.js';
import * as rbacController from './rbac.controller.js';
import {
  CreateRoleSchema,
  RoleIdParamsSchema,
  TenantIdParamsSchema,
  UpdateRoleSchema,
} from './rbac.schema.js';

const router: ExpressRouter = Router({ mergeParams: true });

router.get(
  '/',
  authenticate,
  authorizePermissions(PERMISSIONS.ROLE_VIEW),
  rbacController.assertTenantAccess,
  validate(TenantIdParamsSchema),
  rbacController.listRoles,
);

router.post(
  '/',
  authenticate,
  authorizePermissions(PERMISSIONS.ROLE_CREATE),
  rbacController.assertTenantAccess,
  validate(CreateRoleSchema),
  rbacController.createRole,
);

router.put(
  '/:roleId',
  authenticate,
  authorizePermissions(PERMISSIONS.ROLE_UPDATE),
  rbacController.assertTenantAccess,
  validate(UpdateRoleSchema),
  rbacController.updateRole,
);

router.delete(
  '/:roleId',
  authenticate,
  authorizePermissions(PERMISSIONS.ROLE_DELETE),
  rbacController.assertTenantAccess,
  validate(RoleIdParamsSchema),
  rbacController.deleteRole,
);

export default router;
