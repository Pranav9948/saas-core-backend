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

export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private security: typeof Security,
  ) {}

  async signup(data: any) {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new ConflictException(
        'User already exists',
        ErrorCode.EMAIL_ALREADY_EXISTS,
      );
    }

    const hashed = await this.security.hashPassword(data.password);

    const user = await this.userRepo.createUser({
      email: data.email,
      passwordHash: hashed,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return this.generateAuthResponse(user);
  }

  async login(data: any) {
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (!user.isActive) {
      throw new UnauthorizedException('Account disabled');
    }

    const isValid = await this.security.comparePassword(
      data.password,
      user.passwordHash,
    );
    if (!isValid) throw new UnauthorizedException('Invalid email or password');

    return this.generateAuthResponse(user);
  }

  async rotateRefreshToken(oldToken: string) {
    const payload = this.security.verifyRefreshToken(oldToken);
    const savedToken = await this.userRepo.findRefreshToken(oldToken);

    if (!savedToken) {
      await this.userRepo.deleteAllUserRefreshTokens(payload.userId);
      throw new UnauthorizedException('Security alert: Session compromised.');
    }

    await this.userRepo.deleteRefreshToken(oldToken);

    const user = await this.userRepo.findById(payload.userId);
    if (!user) throw new UnauthorizedException('User not found');

    return this.generateAuthResponse(user);
  }

  async logout(token: string) {
    await this.userRepo.deleteRefreshToken(token);
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1 * 60 * 60 * 1000);

    await this.userRepo.updateResetToken(user.id, resetToken, expiry);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    try {
      const html = getResetPasswordTemplate(resetUrl, user.firstName);
      await sendEmail(user.email, 'Reset your password', html);
    } catch (error) {
      throw new InternalException('Email could not be sent', error);
    }
  }

  async resetPassword(data: any) {
    const user = await this.userRepo.findUserByResetToken(data.token);
    if (!user) {
      throw new BadRequestException(
        'Invalid or expired token',
        ErrorCode.INVALID_TOKEN,
      );
    }

    const hashed = await this.security.hashPassword(data.password);
    await this.userRepo.updatePassword(user.id, hashed);
    await this.userRepo.deleteAllUserRefreshTokens(user.id);
  }

  private async generateAuthResponse(user: any) {
    const accessToken = this.security.generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = this.security.generateRefreshToken({
      userId: user.id,
    });

    await this.userRepo.createRefreshToken(
      user.id,
      refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

    return { user, accessToken, refreshToken };
  }
}

const userRepo = new UserRepository();

export const authService = new AuthService(userRepo, Security);
