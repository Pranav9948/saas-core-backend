import { Request, Response, NextFunction } from 'express';
import {
  getCachedPermissions,
  setCachedPermissions,
} from '@/modules/rbac/permission.cache.js';
import { resolveRoleIdForUser } from '@/modules/rbac/resolve-role-id.js';
import { ForbiddenException } from '@/exceptions/exceptions.js';
import { prisma } from '@/infra/db.js';
import { logger } from '@/core/logger.js';

export const authorizePermissions = (...required: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenException('Unauthenticated');
      }

      const roleId = await resolveRoleIdForUser({
        userId: req.user.userId,
        tenantId: req.user.tenantId,
        role: req.user.role,
        roleId: req.user.roleId,
      });

      req.user.roleId = roleId;

      let permissions = getCachedPermissions(roleId);

      if (!permissions) {
        const role = await prisma.role.findUnique({
          where: { id: roleId },
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        });

        if (!role) {
          throw new ForbiddenException('Role not found');
        }

        permissions = role.permissions.map((rp) => rp.permission.name);
        setCachedPermissions(roleId, permissions);
      }

      const hasAccess = required.every((perm) => permissions!.includes(perm));

      if (!hasAccess) {
        throw new ForbiddenException(
          `Missing permissions: ${required.join(', ')}`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
