import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import healthRoutes from '../modules/health/index.js';
import memberRoutes from '../modules/members/member.routes.js';
import trainerRoutes from '../modules/trainers/trainer.routes.js';
import attendanceRoutes from '../modules/attendance/attendance.routes.js';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { authorizeRoles } from '@/middlewares/role.middleware.js';

const router: ExpressRouter = Router();

/**
 * Main API entry points
 * Versioning is a best practice for production (e.g., /api/v1)
 */
router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use(
  '/members',
  authenticate,
  authorizeRoles('STAFF', 'ADMIN'),
  memberRoutes,
);
router.use('/trainers', trainerRoutes);
router.use('/attendance', attendanceRoutes);

export default router;
