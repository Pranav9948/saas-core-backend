import crypto from 'crypto';
import { Security } from '@/core/security.js';
import { prisma } from '@/infra/db.js';
import {
  LoginSchema,
  ResetPasswordSchema,
  SignupSchema,
} from './auth.schema.js';
import z from 'zod';
import { ErrorCode, HttpException } from '@/exceptions/root.js';
import {
  BadRequestException,
  ConflictException,
  InternalException,
  UnauthorizedException,
} from '@/exceptions/exceptions.js';
import { getResetPasswordTemplate } from '@/utils/templates.js';
import { sendEmail } from '@/utils/mail.js';

export class AuthService {
  async signup(data: z.infer<typeof SignupSchema>) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException(
        'A user with this email already exists',
        ErrorCode.EMAIL_ALREADY_EXISTS,
      );
    }

    const hashed = await Security.hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashed,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    const accessToken = Security.generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = Security.generateRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiryAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { user, accessToken, refreshToken };
  }

  async login(data: z.infer<typeof LoginSchema>) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await Security.comparePassword(
      data.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = Security.generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = Security.generateRefreshToken({ userId: user.id });

    // Persist refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiryAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { user, accessToken, refreshToken };
  }

  async rotateRefreshToken(oldToken: string) {
    const payload = Security.verifyRefreshToken(oldToken);
    const savedToken = await prisma.refreshToken.findUnique({
      where: { token: oldToken },
    });

    // 2. Detection of Theft (Crucial!)
    if (!savedToken) {
      // If the token isn't in DB but was a valid JWT,
      // it might mean it was already used by a hacker!
      // Industrial move: Delete ALL sessions for this user for safety.
      await prisma.refreshToken.deleteMany({
        where: { userId: payload.userId },
      });
      throw new UnauthorizedException('Security alert: Session compromised.');
    }

    // 3. Delete the OLD token (One-time use!)
    await prisma.refreshToken.delete({ where: { token: oldToken } });

    // 4. Generate NEW pair
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) throw new UnauthorizedException('user not found');

    const newAccessToken = Security.generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const newRefreshToken = Security.generateRefreshToken({ userId: user.id });

    // 5. Save the NEW refresh token
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiryAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(token: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: token },
    });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry: expiry },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    try {
      const htmlContent = getResetPasswordTemplate(resetUrl, user.firstName);
      await sendEmail(user.email, 'Reset your password', htmlContent);
    } catch (error) {
      throw new InternalException('Email could not be sent', error);
    }
  }

  async resetPassword(data: z.infer<typeof ResetPasswordSchema>) {
    console.log('data in resetPassword', data);

    const user = await prisma.user.findFirst({
      where: {
        resetToken: data.token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'The reset link is invalid or has expired.',
        ErrorCode.INVALID_TOKEN,
      );
    }

    const hashed = await Security.hashPassword(data.password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashed,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });
  }
}
