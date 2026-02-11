import type { Router as ExpressRouter } from 'express';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { Router } from 'express';
import * as authController from './auth.controller.js';

const router: ExpressRouter = Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);
router.get(
  '/generate-new-tokens',
  authenticate,
  authController.rotateRefreshToken,
);
// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', authenticate, authController.forgotPassword);
router.post('/reset-password', authenticate, authController.resetPassword);

export default router;
