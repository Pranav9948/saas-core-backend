// controllers/super-admin-auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { superAdminService } from './super-admin.services.js';
import { UnauthorizedException } from '@/exceptions/exceptions.js';

class SuperAdminAuthController {
  async createInitialSuperAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { email, password, firstName, lastName } = req.body;

      const result = await superAdminService.createInitialSuperAdmin({
        email,
        password,
        firstName,
        lastName,
      });

      res.status(201).json({
        success: true,
        message: 'Super admin created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const { superAdmin, accessToken, refreshToken } =
        await superAdminService.login(email, password);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          superAdmin,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async rotateRefreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const oldToken = req.cookies.refreshToken;
      if (!oldToken) throw new UnauthorizedException('No refresh token');

      const { accessToken, refreshToken } =
        await superAdminService.rotateRefreshToken(oldToken);

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
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await superAdminService.logout(refreshToken);
      }

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllOwnersWithGyms(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 50);

      const result = await superAdminService.getAllOwnersWithGyms(page, limit);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const superAdminAuthController = new SuperAdminAuthController();
