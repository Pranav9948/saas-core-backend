import { Router, type Router as ExpressRouter } from 'express';
import * as controller from './attendance.controller.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { authenticate } from '@/middlewares/auth.middleware.js';
import {
  MarkAttendanceSchema,
  GetAttendanceByDateSchema,
  MemberStatsSchema,
} from './attendance.schema.js';
import { authorizePermissions } from '@/middlewares/permission.middleware.js';
import { PERMISSIONS } from '../rbac/permissions.constants.js';

const router: ExpressRouter = Router();
router.use(authenticate);

// Mark Attendance (Staff or Admin only at the front desk)
router.post(
  '/',
  authorizePermissions(PERMISSIONS.ATTENDANCE_MARK),
  validate(MarkAttendanceSchema),
  controller.markAttendance,
);

// View list of who is in the gym
router.get(
  '/today',
  authorizePermissions(PERMISSIONS.ATTENDANCE_VIEW),
  controller.getTodaysAttendance,
);
router.get(
  '/history',
  authorizePermissions(PERMISSIONS.ATTENDANCE_VIEW),
  validate(GetAttendanceByDateSchema),
  controller.getAttendanceByDate,
);

// Stats for a specific member
router.get(
  '/stats/:id',
  authorizePermissions(PERMISSIONS.ATTENDANCE_VIEW),
  validate(MemberStatsSchema),
  controller.getMemberStats,
);

export default router;
