import { Router, type Router as ExpressRouter } from 'express';
import * as memberController from './member.controller.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { authenticate } from '@/middlewares/auth.middleware.js';
import {
  CreateMemberSchema,
  MemberIdSchema,
  UpdateMemberSchema,
} from './member.schema.js';
import { PERMISSIONS } from '../rbac/permissions.constants.js';
import { authorizePermissions } from '@/middlewares/permission.middleware.js';

const router: ExpressRouter = Router();

router.post(
  '/',
  authenticate,
  authorizePermissions(PERMISSIONS.MEMBER_CREATE),
  validate(CreateMemberSchema),
  memberController.createMember,
);
router.get(
  '/',
  authenticate,
  authorizePermissions(PERMISSIONS.MEMBER_VIEW),
  memberController.getAllMembers,
);
router.get(
  '/:id',
  authenticate,
  authorizePermissions(PERMISSIONS.MEMBER_VIEW),
  validate(MemberIdSchema),
  memberController.getMemberById,
);
router.patch(
  '/:id',
  authenticate,
  authorizePermissions(PERMISSIONS.MEMBER_UPDATE),
  validate(UpdateMemberSchema),
  memberController.updateMember,
);
router.delete(
  '/:id',
  authenticate,
  authorizePermissions(PERMISSIONS.MEMBER_DELETE),
  validate(MemberIdSchema),
  memberController.deleteMember,
);
router.get(
  '/:id/attendance',
  authenticate,
  authorizePermissions(PERMISSIONS.MEMBER_VIEW),
  validate(MemberIdSchema),
  memberController.getMemberHistory,
);

export default router;
