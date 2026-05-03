import {
  Router,
  type Router as ExpressRouter,
  Request,
  Response,
  NextFunction,
} from 'express';
import { BillingService } from './billing.service.js';
import { prisma } from '@/infra/db.js';
import { logger } from '@/core/logger.js';

const billingService = new BillingService();

export const createCheckoutSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;

    const { planId } = req.body;

    const url = await billingService.createCheckoutSession(tenantId, planId);

    res.status(200).json({
      success: true,
      data: { url },
    });
  } catch (error) {
    logger.error({
      msg: 'Checkout session creation failed',
      err:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : { message: String(error) },
    });
    next(error);
  }
};

export const getAllPlans = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' },
    });

    res.render('billing/plans', { plans });
  } catch (error) {
    next(error);
  }
};
