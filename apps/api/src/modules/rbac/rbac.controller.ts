import { Request, Response, NextFunction } from 'express';
import { ForbiddenException } from '@/exceptions/exceptions.js';
import { rbacService } from './rbac.service.js';

type TenantParams = { tenantId: string };
type RoleParams = { tenantId: string; roleId: string };

export const listPermissions = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const permissions = await rbacService.listPermissions();
    res.status(200).json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};

export const listRoles = async (
  req: Request<TenantParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roles = await rbacService.listRoles(req.params.tenantId);
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (
  req: Request<TenantParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = await rbacService.createRole(req.params.tenantId, req.body);
    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (
  req: Request<RoleParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = await rbacService.updateRole(
      req.params.tenantId,
      req.params.roleId,
      req.body,
    );
    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (
  req: Request<RoleParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    await rbacService.deleteRole(req.params.tenantId, req.params.roleId);
    res.status(200).json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const assertTenantAccess = (
  req: Request<TenantParams>,
  _res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new ForbiddenException('Unauthenticated');
    }

    if (req.params.tenantId !== req.user.tenantId) {
      throw new ForbiddenException('Cannot access another tenant');
    }

    next();
  } catch (error) {
    next(error);
  }
};
