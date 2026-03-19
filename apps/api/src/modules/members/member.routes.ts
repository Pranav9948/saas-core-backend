import { Router, type Router as ExpressRouter } from 'express';
import * as memberController from './member.controller.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { authorizeRoles } from '@/middlewares/role.middleware.js';
import {
  CreateMemberSchema,
  MemberIdSchema,
  UpdateMemberSchema,
} from './member.schema.js';

const router: ExpressRouter = Router();

router.post(
  '/',
  authenticate,
  authorizeRoles('OWNER', 'ADMIN', 'STAFF'),
  validate(CreateMemberSchema),
  memberController.createMember,
);
router.get(
  '/',
  authenticate,
  authorizeRoles('OWNER', 'ADMIN', 'STAFF'),
  memberController.getAllMembers,
);
router.get(
  '/:id',
  authenticate,
  authorizeRoles('OWNER', 'ADMIN', 'STAFF'),
  validate(MemberIdSchema),
  memberController.getMemberById,
);
router.patch(
  '/:id',
  authenticate,
  authorizeRoles('OWNER', 'ADMIN', 'STAFF'),
  validate(UpdateMemberSchema),
  memberController.updateMember,
);
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('OWNER', 'ADMIN', 'STAFF'),
  validate(MemberIdSchema),
  memberController.deleteMember,
);
router.get(
  '/:id/attendance',
  authenticate,
  authorizeRoles('OWNER', 'ADMIN', 'STAFF'),
  validate(MemberIdSchema),
  memberController.getMemberHistory,
);

export default router;
