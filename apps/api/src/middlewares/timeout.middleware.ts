import { Request, Response, NextFunction } from 'express';

const LONG_RUNNING_PATHS = [
  '/billing/checkout-session',
  '/billing/create-checkout-session',
  '/billing/customer-portal',
  '/billing/create-portal-session',
  '/billing/webhook',
  '/api/webhook',
];

export const requestTimeout = (ms: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (LONG_RUNNING_PATHS.some((path) => req.originalUrl.includes(path))) {
      next();
      return;
    }

    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: 'Request timeout',
        });
      }
    }, ms);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};
