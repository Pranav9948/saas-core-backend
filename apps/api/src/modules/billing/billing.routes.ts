import {
  Router,
  type Router as ExpressRouter,
  Request,
  Response,
  NextFunction,
} from 'express';
import * as billingController from './billing.controller.js';
import { authenticate } from '@/middlewares/auth.middleware.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { authorizePermissions } from '@/middlewares/permission.middleware.js';
import { PERMISSIONS } from '../rbac/permissions.constants.js';
import { CreateCheckoutSessionSchema, PaymentHistoryQuerySchema } from './billing.schema.js';

const router: ExpressRouter = Router();

router.post(
  '/checkout-session',
  authenticate,
  validate(CreateCheckoutSessionSchema),
  billingController.createCheckoutSession,
);

router.post(
  '/customer-portal',
  authenticate,
  billingController.createCustomerPortalSession,
);

router.get('/plans', authenticate, billingController.getBillingPlans);

router.get(
  '/subscription',
  authenticate,
  billingController.getBillingSubscription,
);

router.get('/summary', authenticate, billingController.getBillingSummary);

router.get(
  '/payment-history',
  authenticate,
  validate(PaymentHistoryQuerySchema),
  billingController.getPaymentHistory,
);

router.get(
  '/usage',
  authenticate,
  authorizePermissions(PERMISSIONS.TENANT_VIEW),
  billingController.getFeatureUsage,
);

router.get('/plans/preview', billingController.getPlansPreview);

router.get('/success', (_req: Request, res: Response) => {
  res.render('billing/success');
});

router.get('/cancel', (_req: Request, res: Response) => {
  res.render('billing/cancel');
});

export default router;
