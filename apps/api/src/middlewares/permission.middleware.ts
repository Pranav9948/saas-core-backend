import { Request, Response, NextFunction } from 'express';
import {
  getCachedPermissions,
  setCachedPermissions,
} from '@/modules/rbac/permission.cache.js';
import { ForbiddenException } from '@/exceptions/exceptions.js';
import { prisma } from '@/infra/db.js';

export const authorizePermissions = (...required: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenException('Unauthenticated');
      }

      const { roleId } = req.user;

      // 🔥 1. Check cache
      let permissions = getCachedPermissions(roleId);

      // 🔥 2. If not cached → fetch from DB
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

        // 🔥 store in cache
        setCachedPermissions(roleId, permissions);
      }

      // 🔥 3. Authorization check
      const hasAccess = required.every((perm) => permissions.includes(perm));

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
