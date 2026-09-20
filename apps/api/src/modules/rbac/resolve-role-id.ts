import { prisma } from '@/infra/db.js';
import { ForbiddenException } from '@/exceptions/exceptions.js';
import { logger } from '@/core/logger.js';

type ResolveRoleIdInput = {
  userId: string;
  tenantId: string;
  role: string;
  roleId?: string | null;
};

/**
 * Ensures a valid RBAC roleId exists for the authenticated tenant user.
 * Backfills tenant_users.role_id when missing (legacy accounts).
 */
export async function resolveRoleIdForUser({
  userId,
  tenantId,
  role,
  roleId,
}: ResolveRoleIdInput): Promise<string> {
  if (roleId) {
    const existingRole = await prisma.role.findFirst({
      where: { id: roleId, tenantId },
      select: { id: true },
    });

    if (existingRole) {
      return existingRole.id;
    }

    logger.warn(
      { userId, tenantId, role, roleId },
      'JWT roleId does not belong to tenant; resolving from role name',
    );
  }

  const roleRecord = await prisma.role.findFirst({
    where: {
      tenantId,
      name: role,
    },
    select: { id: true },
  });

  if (!roleRecord) {
    throw new ForbiddenException(
      'RBAC roles are not configured for this gym. Run database seed or contact support.',
    );
  }

  await prisma.tenantUser.update({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      },
    },
    data: {
      roleId: roleRecord.id,
    },
  });

  logger.info(
    { userId, tenantId, role, roleId: roleRecord.id },
    'Backfilled tenant user roleId',
  );

  return roleRecord.id;
}
