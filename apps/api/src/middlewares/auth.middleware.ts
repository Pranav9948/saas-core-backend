import { readAccessTokenFromRequest } from '@/core/auth-cookies.js';
import { Security } from '@/core/security.js';
import {
  AUTH_TOKEN_MESSAGE,
  UnauthorizedException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { Request, Response, NextFunction } from 'express';

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const token = readAccessTokenFromRequest(req);
  if (!token) {
    next(
      new UnauthorizedException(AUTH_TOKEN_MESSAGE, ErrorCode.UNAUTHORIZED),
    );
    return;
  }

  try {
    const decoded = Security.verifyAccessToken(token);
    if (!decoded.tenantId) {
      next(
        new UnauthorizedException(
          AUTH_TOKEN_MESSAGE,
          ErrorCode.INVALID_TOKEN,
        ),
      );
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof UnauthorizedException) {
      next(err);
      return;
    }

    next(new UnauthorizedException(AUTH_TOKEN_MESSAGE, ErrorCode.INVALID_TOKEN));
  }
};
