import type { Router as ExpressRouter } from 'express';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '@/middlewares/validate.middleware.js';
import {
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  SignupSchema,
} from './auth.schema.js';

const router: ExpressRouter = Router();

router.post('/signup', validate(SignupSchema), authController.signup);
router.post('/login', validate(LoginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);
router.get('/generate-new-tokens', authController.rotateRefreshToken);

router.post(
  '/forgot-password',
  validate(ForgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  validate(ResetPasswordSchema),
  authController.resetPassword,
);

router.post('/logout', authenticate, authController.logout);

export default router;
