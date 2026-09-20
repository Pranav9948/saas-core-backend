import { clearAuthCookies, setAuthCookies } from "@/core/auth-cookies.js";
import { logger } from "@/core/logger.js";
import {
  NotFoundException,
  UnauthorizedException,
} from "@/exceptions/exceptions.js";
import { ErrorCode } from "@/exceptions/root.js";
import { prisma } from "@/infra/db.js";
import { getTenantPrisma } from "@/infra/tenant-prisma.js";
import { NextFunction, Request, Response } from "express";
import { authService } from "./auth.service.js";

export const registerGym = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.registerGym(req.body);

    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    res.status(201).json({
      success: true,
      message: "Gym registered successfully",
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

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user, accessToken, refreshToken, tenant } = await authService.login(
      req.body,
    );

    setAuthCookies(res, { accessToken, refreshToken });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
      tenant,
    });
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

    clearAuthCookies(res);

    res.status(200).json({ success: true, message: "Logged out successfully" });
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
      throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
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
    if (!oldToken) {
      throw new UnauthorizedException(
        "Refresh token is missing or expired",
        ErrorCode.TOKEN_EXPIRED,
      );
    }

    logger.info(`oldToken ${oldToken}`);

    const { accessToken, refreshToken } =
      await authService.rotateRefreshToken(oldToken);

    setAuthCookies(res, { accessToken, refreshToken });

    res.set("Cache-Control", "no-store");

    res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    logger.info(`error in rotateRefreshToken ${error}`);
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await authService.forgotPassword(req.body.email);

    res.status(200).json({
      success: true,
      message:
        "If an account exists with that email, a reset link has been sent.",
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
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};
