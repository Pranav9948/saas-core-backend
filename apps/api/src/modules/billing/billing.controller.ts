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
import { HttpException } from '@/exceptions/root.js';

const billingService = new BillingService();

export const createCheckoutSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const { planId } = req.body;

    const url = await billingService.createCheckoutSession(
      tenantId,
      userId,
      planId,
    );

    res.status(200).json({
      success: true,
      data: { url },
    });
  } catch (error) {
    if (!(error instanceof HttpException)) {
      logger.error({
        msg: 'Checkout session creation failed',
        tenantId: req.user?.tenantId,
        userId: req.user?.userId,
        err:
          error instanceof Error
            ? { message: error.message, name: error.name }
            : { message: String(error) },
      });
    }
    next(error);
  }
};

export const getBillingPlans = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;
    const data = await billingService.getBillingPlans(tenantId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getBillingSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;
    const data = await billingService.getBillingSubscription(tenantId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getBillingSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;
    const data = await billingService.getBillingSummary(tenantId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomerPortalSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;
    const url = await billingService.createCustomerPortalSession(tenantId);

    res.status(200).json({
      success: true,
      data: { url },
    });
  } catch (error) {
    if (!(error instanceof HttpException)) {
      logger.error({
        msg: 'Customer portal session creation failed',
        tenantId: req.user?.tenantId,
        err:
          error instanceof Error
            ? { message: error.message, name: error.name }
            : { message: String(error) },
      });
    }
    next(error);
  }
};

export const getPlansPreview = async (
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
