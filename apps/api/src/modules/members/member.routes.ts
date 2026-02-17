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
router.use(authenticate);

router.post(
  '/',
  authorizeRoles('ADMIN', 'STAFF'),
  validate(CreateMemberSchema),
  memberController.createMember,
);
router.get(
  '/',
  authorizeRoles('ADMIN', 'STAFF'),
  memberController.getAllMembers,
);
router.get('/:id', validate(MemberIdSchema), memberController.getMemberById);
router.patch(
  '/:id',
  authorizeRoles('ADMIN', 'STAFF'),
  validate(UpdateMemberSchema),
  memberController.updateMember,
);
router.delete(
  '/:id',
  authorizeRoles('ADMIN'),
  validate(MemberIdSchema),
  memberController.deleteMember,
);
router.get(
  '/:id/attendance',
  validate(MemberIdSchema),
  memberController.getMemberHistory,
);

export default router;
