import { readAccessTokenFromRequest } from '@/core/auth-cookies.js';
import { Security } from '@/core/security.js';
import { UnauthorizedException } from '@/exceptions/exceptions.js';
import { Request, Response, NextFunction } from 'express';

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const token = readAccessTokenFromRequest(req);
  if (!token) {
    throw new UnauthorizedException('No token provided');
  }

  try {
    const decoded = Security.verifyAccessToken(token);
    if (!decoded.tenantId) {
      throw new UnauthorizedException('Invalid token: Tenant context missing');
    }

    req.user = decoded;
    next();
  } catch (err) {
    next(new UnauthorizedException('Invalid or expired access token'));
  }
};
