import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service.js';
import { NotFoundException } from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { TenantRepository } from '@/modules/tenant/tenant.repository.js';

const tenantRepo = new TenantRepository();
const tenantService = new TenantService(tenantRepo);

export const getCurrentTenant = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;

    const tenant = await tenantService.getCurrentTenant(tenantId);

    if (!tenant) {
      throw new NotFoundException('Tenant not found', ErrorCode.NOT_FOUND);
    }

    res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTenant = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;

    const tenant = await tenantService.updateTenant(tenantId, req.body);

    res.status(200).json({
      success: true,
      message: 'Gym details updated successfully',
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
};
