import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SUPER_ADMIN_ACCESS_SECRET: string =
  process.env.SUPER_ADMIN_ACCESS_SECRET!;
const SUPER_ADMIN_REFRESH_SECRET: string =
  process.env.SUPER_ADMIN_REFRESH_SECRET!;

export interface SuperAdminTokenPayload {
  id: string;
  email: string;
  role: 'SUPER_ADMIN';
}

export interface SuperAdminRefreshTokenPayload {
  id: string;
}

export const SuperAdminSecurity = {
  hashPassword: (password: string) => bcrypt.hash(password, 12),

  comparePassword: (password: string, hash: string) =>
    bcrypt.compare(password, hash),

  generateAccessToken: (payload: SuperAdminTokenPayload): string => {
    return jwt.sign(payload, SUPER_ADMIN_ACCESS_SECRET, { expiresIn: '25m' });
  },

  generateRefreshToken: (payload: SuperAdminRefreshTokenPayload): string => {
    return jwt.sign(payload, SUPER_ADMIN_REFRESH_SECRET, { expiresIn: '7d' });
  },

  verifyAccessToken: (token: string): SuperAdminTokenPayload => {
    try {
      const decoded = jwt.verify(token, SUPER_ADMIN_ACCESS_SECRET);

      // Validate and cast the decoded token
      if (
        typeof decoded === 'object' &&
        decoded !== null &&
        'id' in decoded &&
        'email' in decoded &&
        'role' in decoded
      ) {
        return decoded as SuperAdminTokenPayload;
      }

      throw new Error('Invalid token payload');
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  },

  verifyRefreshToken: (token: string): SuperAdminRefreshTokenPayload => {
    try {
      const decoded = jwt.verify(token, SUPER_ADMIN_REFRESH_SECRET);

      if (typeof decoded === 'object' && decoded !== null && 'id' in decoded) {
        return { id: decoded.id as string };
      }

      throw new Error('Invalid refresh token payload');
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  },
};
