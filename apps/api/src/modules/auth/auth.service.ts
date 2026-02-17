import crypto from 'crypto';
import { UserRepository } from './auth.repository.js';
import {
  BadRequestException,
  ConflictException,
  InternalException,
  UnauthorizedException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { Security } from '@/core/security.js';
import { getResetPasswordTemplate } from '@/utils/templates.js';
import { sendEmail } from '@/utils/mail.js';

const userRepo = new UserRepository();

export class AuthService {
  async signup(data: any) {
    const existing = await userRepo.findByEmail(data.email);
    if (existing) {
      throw new ConflictException(
        'User already exists',
        ErrorCode.EMAIL_ALREADY_EXISTS,
      );
    }

    const hashed = await Security.hashPassword(data.password);
    const user = await userRepo.createUser({
      email: data.email,
      passwordHash: hashed,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return this.generateAuthResponse(user);
  }

  async login(data: any) {
    const user = await userRepo.findByEmail(data.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (!user.isActive) {
      throw new UnauthorizedException('Account disabled');
    }

    const isValid = await Security.comparePassword(
      data.password,
      user.passwordHash,
    );
    if (!isValid) throw new UnauthorizedException('Invalid email or password');

    return this.generateAuthResponse(user);
  }

  async rotateRefreshToken(oldToken: string) {
    const payload = Security.verifyRefreshToken(oldToken);
    const savedToken = await userRepo.findRefreshToken(oldToken);

    if (!savedToken) {
      await userRepo.deleteAllUserRefreshTokens(payload.userId);
      throw new UnauthorizedException('Security alert: Session compromised.');
    }

    await userRepo.deleteRefreshToken(oldToken);

    const user = await userRepo.findById(payload.userId);
    if (!user) throw new UnauthorizedException('User not found');

    return this.generateAuthResponse(user);
  }

  async logout(token: string) {
    await userRepo.deleteRefreshToken(token);
  }

  async forgotPassword(email: string) {
    const user = await userRepo.findByEmail(email);
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1 * 60 * 60 * 1000);

    await userRepo.updateResetToken(user.id, resetToken, expiry);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    try {
      const html = getResetPasswordTemplate(resetUrl, user.firstName);
      await sendEmail(user.email, 'Reset your password', html);
    } catch (error) {
      throw new InternalException('Email could not be sent', error);
    }
  }

  async resetPassword(data: any) {
    const user = await userRepo.findUserByResetToken(data.token);
    if (!user) {
      throw new BadRequestException(
        'Invalid or expired token',
        ErrorCode.INVALID_TOKEN,
      );
    }

    const hashed = await Security.hashPassword(data.password);
    await userRepo.updatePassword(user.id, hashed);
    await userRepo.deleteAllUserRefreshTokens(user.id);
  }

  private async generateAuthResponse(user: any) {
    const accessToken = Security.generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = Security.generateRefreshToken({ userId: user.id });

    await userRepo.createRefreshToken(
      user.id,
      refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

    return { user, accessToken, refreshToken };
  }
}
