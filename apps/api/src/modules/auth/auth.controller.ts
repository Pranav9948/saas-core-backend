import { NextFunction, Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { prisma } from '@/infra/db.js';
import {
  SignupSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from './auth.schema.js';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';

const authService = new AuthService();

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = await SignupSchema.parse(req.body);

    const { user, accessToken, refreshToken } =
      await authService.signup(validatedData);

    // Set the Refresh Token in a secure httpOnly cookie

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'User registered and logged in successfully',
      data: {
        user,
        accessToken, // Access token goes in the body for the frontend to store in memory
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = LoginSchema.safeParse(req.body);

    if (!result.success) {
      throw new BadRequestException('Validation failed');
    }

    const { user, accessToken, refreshToken } = await authService.login(
      result.data,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken, user: { id: user.id, email: user.email } });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // 1. Remove from Database
      await authService.logout(refreshToken);
    }

    // 2. Clear the Cookie from the browser
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND);
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const rotateRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const oldToken = req.cookies.refreshToken;
    if (!oldToken) throw new UnauthorizedException('No refresh token');

    const { accessToken, refreshToken } =
      await authService.rotateRefreshToken(oldToken);

    // Overwrite the cookie with the NEW rotated token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = ForgotPasswordSchema.safeParse(req.body);

    if (!result.success) {
      throw new BadRequestException('Validation failed');
    }

    await authService.forgotPassword(req.body.email);

    res.status(200).json({
      success: true,
      message:
        'If an account exists with that email, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validatedData = await ResetPasswordSchema.parse(req.body);

    await authService.resetPassword(validatedData);

    res.status(200).json({
      success: true,
      message:
        'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};
