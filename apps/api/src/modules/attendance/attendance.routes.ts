import { Router, type Router as ExpressRouter } from 'express';
import * as controller from './attendance.controller.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { authorizeRoles } from '@/middlewares/role.middleware.js';
import {
  MarkAttendanceSchema,
  GetAttendanceByDateSchema,
  MemberStatsSchema,
} from './attendance.schema.js';

const router: ExpressRouter = Router();
router.use(authenticate);

// Mark Attendance (Staff or Admin only at the front desk)
router.post(
  '/',
  authorizeRoles('ADMIN', 'STAFF'),
  validate(MarkAttendanceSchema),
  controller.markAttendance,
);

// View list of who is in the gym
router.get(
  '/today',
  authorizeRoles('ADMIN', 'STAFF'),
  controller.getTodaysAttendance,
);
router.get(
  '/history',
  authorizeRoles('ADMIN', 'STAFF'),
  validate(GetAttendanceByDateSchema),
  controller.getAttendanceByDate,
);

// Stats for a specific member
router.get(
  '/stats/:id',
  authorizeRoles('ADMIN', 'STAFF'),
  validate(MemberStatsSchema),
  controller.getMemberStats,
);

export default router;
