import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UnauthorizedException } from '@/exceptions/exceptions.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface AccessTokenPayload {
  userId: string;
  tenantId: string;
  roleId: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tenantId: string; // We include this to make rotation tenant-aware
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const Security = {
  hashPassword: (password: string) => bcrypt.hash(password, 12),

  comparePassword: (password: string, hash: string) =>
    bcrypt.compare(password, hash),

  /**
   * Generates a short-lived access token with tenant context.
   */
  generateAccessToken: (payload: AccessTokenPayload) => {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
  },

  /**
   * Generates a long-lived refresh token.
   * We include tenantId to ensure the session is bound to the specific gym.
   */
  generateRefreshToken: (payload: RefreshTokenPayload) => {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  },

  /**
   * Verifies and casts the Access Token
   */
  verifyAccessToken: (token: string) => {
    try {
      return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access token expired');
      }
      throw new UnauthorizedException('Invalid access token');
    }
  },

  /**
   * Verifies and casts the Refresh Token
   */
  verifyRefreshToken: (token: string) => {
    return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
  },
};
