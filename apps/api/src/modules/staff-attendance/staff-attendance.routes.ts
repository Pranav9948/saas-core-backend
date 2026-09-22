import { Router, type Router as ExpressRouter } from 'express';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { authorizePermissions } from '@/middlewares/permission.middleware.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { PERMISSIONS } from '../rbac/permissions.constants.js';
import * as staffAttendanceController from './staff-attendance.controller.js';
import {
  MarkStaffAttendanceSchema,
  StaffAttendanceQuerySchema,
  ListStaffAttendanceQuerySchema,
} from './staff-attendance.schema.js';

const router: ExpressRouter = Router();

router.use(authenticate);

router.get(
  '/metrics',
  authorizePermissions(PERMISSIONS.TENANT_VIEW),
  validate(StaffAttendanceQuerySchema),
  staffAttendanceController.getStaffMetrics,
);

router.get(
  '/',
  authorizePermissions(PERMISSIONS.ATTENDANCE_VIEW),
  validate(ListStaffAttendanceQuerySchema),
  staffAttendanceController.listStaffAttendance,
);

router.post(
  '/',
  authorizePermissions(PERMISSIONS.ATTENDANCE_MARK),
  validate(MarkStaffAttendanceSchema),
  staffAttendanceController.markStaffAttendance,
);

export default router;
