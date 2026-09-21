import type { NextFunction, Request, Response } from 'express';
import { ForbiddenException } from '@/exceptions/exceptions.js';

export function requireOwner(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.user?.role !== 'OWNER') {
    next(new ForbiddenException('Only gym owners can manage billing'));
    return;
  }

  next();
}
