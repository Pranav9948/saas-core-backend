import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import healthRoutes from '../modules/health/index.js';

const router: ExpressRouter = Router();

/**
 * Main API entry points
 * Versioning is a best practice for production (e.g., /api/v1)
 */
router.use('/auth', authRoutes);
router.use('/health', healthRoutes);

// You can add more modules here as you build them:
// router.use('/members', memberRoutes);
// router.use('/trainers', trainerRoutes);

export default router;
