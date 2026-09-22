import { Router, type Router as ExpressRouter } from 'express';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { authorizePermissions } from '@/middlewares/permission.middleware.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { PERMISSIONS } from '../rbac/permissions.constants.js';
import * as packageController from './package.controller.js';
import {
  CreatePackageSchema,
  PackageIdSchema,
  UpdatePackageSchema,
} from './package.schema.js';

const router: ExpressRouter = Router();

router.use(authenticate);

router.get(
  '/',
  authorizePermissions(PERMISSIONS.MEMBER_VIEW),
  packageController.listPackages,
);

router.post(
  '/',
  authorizePermissions(PERMISSIONS.TENANT_UPDATE),
  validate(CreatePackageSchema),
  packageController.createPackage,
);

router.patch(
  '/:id',
  authorizePermissions(PERMISSIONS.TENANT_UPDATE),
  validate(UpdatePackageSchema),
  packageController.updatePackage,
);

router.delete(
  '/:id',
  authorizePermissions(PERMISSIONS.TENANT_UPDATE),
  validate(PackageIdSchema),
  packageController.deletePackage,
);

export default router;
