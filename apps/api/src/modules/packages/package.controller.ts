import { NextFunction, Request, Response } from 'express';
import { MembershipPackageService } from './package.service.js';

const packageService = new MembershipPackageService();

export const listPackages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const packages = await packageService.listPackages(
      req.user!.tenantId,
      includeInactive,
    );
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    next(error);
  }
};

export const createPackage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pkg = await packageService.createPackage(req.user!.tenantId, req.body);
    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    next(error);
  }
};

export const updatePackage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pkg = await packageService.updatePackage(
      String(req.params.id),
      req.user!.tenantId,
      req.body,
    );
    res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    next(error);
  }
};

export const deletePackage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await packageService.deletePackage(String(req.params.id), req.user!.tenantId);
    res.status(200).json({ success: true, message: 'Package deleted' });
  } catch (error) {
    next(error);
  }
};
