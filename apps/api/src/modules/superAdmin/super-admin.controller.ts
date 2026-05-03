import { Request, Response, NextFunction } from 'express';
import { superAdminService } from './super-admin.services.js';
import { UnauthorizedException } from '@/exceptions/exceptions.js';

type PlanParams = {
  id: string;
};

class SuperAdminAuthController {
  async createInitialSuperAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
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
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      const { superAdmin, accessToken, refreshToken } =
        await superAdminService.login(email, password);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          superAdmin,
        },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async rotateRefreshToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
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
        path: '/',
      });

      res.status(200).json({
        success: true,
        data: { accessToken },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await superAdminService.logout(refreshToken);
      }

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async getAllOwnersWithGyms(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 50);

      const result = await superAdminService.getAllOwnersWithGyms(page, limit);

      res.status(200).json({
        success: true,
        ...result,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async createPlan(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const plan = await superAdminService.createPlan(req.body);
      res.status(201).json({ success: true, data: plan });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async getAllPlans(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const plans = await superAdminService.getAllPlans();
      res.status(200).json({ success: true, data: plans });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async updatePlan(
    req: Request<PlanParams>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const plan = await superAdminService.updatePlan(req.params.id, req.body);
      res.status(200).json({ success: true, data: plan });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async deletePlan(
    req: Request<PlanParams>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await superAdminService.deletePlan(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Plan deleted successfully',
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}

export const superAdminAuthController = new SuperAdminAuthController();
