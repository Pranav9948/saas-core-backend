import { logger } from '@/core/logger.js';
import { ForbiddenException } from '@/exceptions/exceptions.js';
import { Request, Response, NextFunction } from 'express';

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Check if user exists (set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({ message: 'User context not found' });
    }

    // 2. Check if the user's role is in the allowed list
    const hasRole = allowedRoles.includes(req.user.role);

    if (!hasRole) {
      return res.status(403).json({
        message: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    // 3. Success: move to the controller
    next();
  };
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    logger.info({ user: req.user }, 'Authenticated user', roles, 'roles');
    logger.info(roles, 'roles');
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }
    next();
  };
};
