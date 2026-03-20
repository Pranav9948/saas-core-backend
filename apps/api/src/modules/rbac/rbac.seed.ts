import { prisma } from '../../infra/db.js';
import { ALL_PERMISSIONS } from './permissions.constants.js';

export async function seedPermissions() {
  await prisma.permission.createMany({
    data: ALL_PERMISSIONS.map((name) => ({ name })),
    skipDuplicates: true,
  });

  console.log('✅ Permissions seeded');
}

/**
 *  Create roles per tenant
 */
export async function createRolesForTenant(tenantId: string) {
  const roles = ['OWNER', 'ADMIN', 'STAFF', 'TRAINER'];

  const createdRoles = await Promise.all(
    roles.map((name) =>
      prisma.role.upsert({
        where: {
          name_tenantId: { name, tenantId },
        },
        update: {},
        create: {
          name,
          tenantId,
        },
      }),
    ),
  );

  return createdRoles;
}

/**
 *  Assign permissions
 */
const ROLE_PERMISSIONS = {
  OWNER: ALL_PERMISSIONS,

  ADMIN: ALL_PERMISSIONS.filter((p) => p !== 'user:update-role'),

  STAFF: [
    'member:create',
    'member:view',
    'member:update',
    'attendance:mark',
    'attendance:view',
  ],

  TRAINER: ['member:view', 'attendance:view'],
};

export async function assignPermissionsToRoles(roles: any[]) {
  const permissions = await prisma.permission.findMany();

  const permissionMap = Object.fromEntries(
    permissions.map((p) => [p.name, p.id]),
  );

  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role.name as keyof typeof ROLE_PERMISSIONS];

    await prisma.rolePermission.createMany({
      data: perms.map((permName) => ({
        roleId: role.id,
        permissionId: permissionMap[permName],
      })),
      skipDuplicates: true,
    });
  }
}

/**
 *  Apply to all tenants
 */
export async function seedRolesForAllTenants() {
  const tenants = await prisma.tenant.findMany();

  for (const tenant of tenants) {
    const roles = await createRolesForTenant(tenant.id);
    await assignPermissionsToRoles(roles);
  }

  console.log('✅ Roles + permissions assigned');
}
