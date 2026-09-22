import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import authRoutes from '../../modules/auth/auth.routes.js';
import healthRoutes from '../../modules/health/index.js';
import memberRoutes from '../../modules/members/member.routes.js';
import trainerRoutes from '../../modules/trainers/trainer.routes.js';
import attendanceRoutes from '../../modules/attendance/attendance.routes.js';
import tenantRoutes from '../../modules/tenant/tenant.route.js';
import superAdminRoutes from '../../modules/superAdmin/super-admin.routes.js';
import goalRoutes from '../../modules/features/goals/goal.routes.js';
import billingRoutes from '../../modules/billing/billing.routes.js';
import packageRoutes from '../../modules/packages/package.routes.js';
import staffAttendanceRoutes from '../../modules/staff-attendance/staff-attendance.routes.js';
import permissionsRoutes from '../../modules/rbac/permissions.routes.js';
import rolesRoutes from '../../modules/rbac/roles.routes.js';
import debugRoutes from '../../scripts/debug.routes.js';

const router: ExpressRouter = Router();

router.use('/auth', authRoutes);

router.use('/health', healthRoutes);
router.use('/members', memberRoutes);
router.use('/trainers', trainerRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/tenant', tenantRoutes);
router.use('/super-admin', superAdminRoutes);
router.use('/billing', billingRoutes);
router.use('/packages', packageRoutes);
router.use('/staff-attendance', staffAttendanceRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/tenants/:tenantId/roles', rolesRoutes);
router.use('/debug', debugRoutes);
router.use('/goals', goalRoutes);

export default router;
