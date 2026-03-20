import { logger } from '@/core/logger.js';
import { Security } from '@/core/security.js';
import { UnauthorizedException } from '@/exceptions/exceptions.js';
import { Request, Response, NextFunction } from 'express';

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedException('No token provided');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = Security.verifyAccessToken(token);
    if (!decoded.tenantId) {
      throw new UnauthorizedException('Invalid token: Tenant context missing');
    }
    logger.info(`decoded: ${JSON.stringify(decoded, null, 2)}`);

    req.user = decoded;
    next();
  } catch (err) {
    next(new UnauthorizedException('Invalid or expired access token'));
  }
};
