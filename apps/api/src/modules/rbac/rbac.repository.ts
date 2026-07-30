import { prisma } from '@/infra/db.js';

export class RbacRepository {
  findAllPermissions() {
    return prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findPermissionsByIds(ids: string[]) {
    return prisma.permission.findMany({
      where: { id: { in: ids } },
    });
  }

  findRolesByTenant(tenantId: string) {
    return prisma.role.findMany({
      where: { tenantId },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findRoleById(roleId: string, tenantId: string) {
    return prisma.role.findFirst({
      where: { id: roleId, tenantId },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
    });
  }

  async createRoleWithPermissions(
    tenantId: string,
    name: string,
    permissionIds: string[],
  ) {
    return prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: { name, tenantId },
      });

      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
      });

      return tx.role.findUniqueOrThrow({
        where: { id: role.id },
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } },
        },
      });
    });
  }

  async updateRoleWithPermissions(
    roleId: string,
    tenantId: string,
    data: { name?: string; permissionIds?: string[] },
  ) {
    return prisma.$transaction(async (tx) => {
      if (data.name) {
        await tx.role.update({
          where: { id: roleId, tenantId },
          data: { name: data.name },
        });
      }

      if (data.permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId } });
        await tx.rolePermission.createMany({
          data: data.permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }

      return tx.role.findUniqueOrThrow({
        where: { id: roleId },
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } },
        },
      });
    });
  }

  deleteRole(roleId: string, tenantId: string) {
    return prisma.role.delete({
      where: { id: roleId, tenantId },
    });
  }
}
