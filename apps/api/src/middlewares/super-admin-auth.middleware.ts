import { Request, Response, NextFunction } from 'express';
import { readAccessTokenFromRequest } from '@/core/auth-cookies.js';
import { SuperAdminSecurity } from '@/core/super-admin.security.js';
import {
  AUTH_TOKEN_MESSAGE,
  FORBIDDEN_ACTION_MESSAGE,
  UnauthorizedException,
  ForbiddenException,
} from '@/exceptions/exceptions.js';
import { superAdminRepo } from '@/modules/superAdmin/super-admin.repository.js';

declare global {
  namespace Express {
    interface Request {
      superAdmin?: {
        id: string;
        email: string;
        role: 'SUPER_ADMIN';
      };
    }
  }
}

export const authenticateSuperAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token = readAccessTokenFromRequest(req);
    if (!token) {
      throw new UnauthorizedException(AUTH_TOKEN_MESSAGE);
    }

    try {
      const decoded = SuperAdminSecurity.verifyAccessToken(token);

      // Verify super admin still exists and is active
      const superAdmin = await superAdminRepo.findById(decoded.id);
      if (!superAdmin || !superAdmin.isActive) {
        throw new UnauthorizedException('Super admin not found or inactive');
      }

      req.superAdmin = decoded;
      next();
    } catch (err) {
        throw new UnauthorizedException(AUTH_TOKEN_MESSAGE);
    }
  } catch (error) {
    next(error);
  }
};

export const requireSuperAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.superAdmin || req.superAdmin.role !== 'SUPER_ADMIN') {
    throw new ForbiddenException(FORBIDDEN_ACTION_MESSAGE);
  }
  next();
};
