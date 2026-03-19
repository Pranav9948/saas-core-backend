import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service.js';
import {
  BadRequestException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
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

export const uploadGymLogo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;

    if (!req.file) {
      throw new BadRequestException('Logo file is required');
    }

    const result = await tenantService.uploadLogo(
      tenantId,
      req.file.buffer,
      req.file.mimetype,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const inviteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;
    const inviterRole = req.user!.role;

    const result = await tenantService.inviteUser(
      tenantId,
      inviterRole,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: 'Invite sent successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const createUserDirect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;
    const inviterRole = req.user!.role;

    const result = await tenantService.createUserDirect(
      tenantId,
      inviterRole,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const acceptInvite = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await tenantService.acceptInvite(req.body);

    res.status(200).json({
      success: true,
      message: 'Account created successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
