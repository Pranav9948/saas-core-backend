import { prisma } from '../../infra/db.js';
import { ALL_PERMISSIONS } from './permissions.constants.js';

/**
 * Ensures every tenant OWNER role has all current permissions (idempotent).
 */

export async function syncOwnerRolePermissions(): Promise<void> {
  const permissions = await prisma.permission.findMany();
  const permissionMap = Object.fromEntries(
    permissions.map((permission) => [permission.name, permission.id]),
  );

  const ownerPermissionIds = ALL_PERMISSIONS.map(
    (name) => permissionMap[name],
  ).filter((id): id is string => Boolean(id));

  if (ownerPermissionIds.length === 0) {
    return;
  }

  const ownerRoles = await prisma.role.findMany({
    where: { name: 'OWNER' },
    select: { id: true },
  });

  for (const role of ownerRoles) {
    await prisma.rolePermission.createMany({
      data: ownerPermissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId,
      })),
      skipDuplicates: true,
    });
  }
}
