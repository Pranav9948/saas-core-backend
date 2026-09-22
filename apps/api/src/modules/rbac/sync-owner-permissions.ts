import { prisma } from '../../infra/db.js';
import { ALL_PERMISSIONS } from './permissions.constants.js';

const SYSTEM_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  OWNER: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS.filter(
    (permission) => permission !== 'user:update-role' && !permission.startsWith('role:'),
  ),
  STAFF: [
    'member:create',
    'member:view',
    'member:update',
    'trainer:create',
    'trainer:view',
    'user:invite',
    'attendance:mark',
    'attendance:view',
  ],
  TRAINER: ['member:view', 'attendance:view', 'goal:view'],
};

export async function syncSystemRolePermissions(): Promise<void> {
  const permissions = await prisma.permission.findMany();
  const permissionMap = Object.fromEntries(
    permissions.map((permission) => [permission.name, permission.id]),
  );

  for (const [roleName, permissionNames] of Object.entries(SYSTEM_ROLE_PERMISSIONS)) {
    const permissionIds = permissionNames
      .map((name) => permissionMap[name])
      .filter((id): id is string => Boolean(id));

    if (permissionIds.length === 0) {
      continue;
    }

    const roles = await prisma.role.findMany({
      where: { name: roleName },
      select: { id: true },
    });

    for (const role of roles) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }
  }
}

export async function syncOwnerRolePermissions(): Promise<void> {
  await syncSystemRolePermissions();
}
