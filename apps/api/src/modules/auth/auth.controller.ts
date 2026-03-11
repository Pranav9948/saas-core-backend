import { NextFunction, Request, Response } from 'express';
import { authService } from './auth.service.js';
import { prisma } from '@/infra/db.js';
import {
  NotFoundException,
  UnauthorizedException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { getTenantPrisma } from '@/infra/tenant-prisma.js';

export const registerGym = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.registerGym(req.body);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Gym registered successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        tenant: result.tenant,
      },
    });
  } catch (error) {
    next(error);
  }
};

// export const signup = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const { user, accessToken, refreshToken } = await authService.signup(
//       req.body,
//     );

//     // Set the Refresh Token in a secure httpOnly cookie

//     res.cookie('refreshToken', refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     res.status(201).json({
//       success: true,
//       message: 'User registered and logged in successfully',
//       data: {
//         user,
//         accessToken,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(
      req.body,
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
    const tenantId = req.user!.tenantId;
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken, tenantId);
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
    const tenantId = req.user!.tenantId;
    const userId = req.user?.userId;

    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    const user = await tenantPrisma.user.findUnique({
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

    const tenantId = authService.getTenantIdFromRefreshToken(oldToken);

    const { accessToken, refreshToken } =
      await authService.rotateRefreshToken(oldToken);

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
    const tenantId = req.user!.tenantId;
    await authService.forgotPassword(req.body.email, tenantId);

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
    const tenantId = req.user!.tenantId;
    await authService.resetPassword(req.body, tenantId);

    res.status(200).json({
      success: true,
      message:
        'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};
