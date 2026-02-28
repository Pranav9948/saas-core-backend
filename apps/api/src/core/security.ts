import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from './logger.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

logger.info(process.env.JWT_ACCESS_SECRET, 'JWT ACCESS:');

export const Security = {
  hashPassword: (password: string) => bcrypt.hash(password, 12),

  comparePassword: (password: string, hash: string) =>
    bcrypt.compare(password, hash),

  generateAccessToken: (payload: { userId: string; role: string }) => {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
  },

  generateRefreshToken: (payload: { userId: string }) => {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  },

  verifyAccessToken: (token: string) => {
    return jwt.verify(token, ACCESS_SECRET) as { userId: string; role: string };
  },

  verifyRefreshToken: (token: string) => {
    return jwt.verify(token, REFRESH_SECRET) as { userId: string };
  },
};
