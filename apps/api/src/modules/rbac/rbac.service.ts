import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import {
  PROTECTED_ROLE_NAMES,
  SYSTEM_ROLE_NAMES,
} from './permissions.constants.js';
import { RbacRepository } from './rbac.repository.js';
import {
  clearPermissionCacheForRole,
} from './permission.cache.js';

function formatRole(role: Awaited<ReturnType<RbacRepository['findRolesByTenant']>>[number]) {
  return {
    id: role.id,
    name: role.name,
    tenantId: role.tenantId,
    isSystem: SYSTEM_ROLE_NAMES.includes(
      role.name as (typeof SYSTEM_ROLE_NAMES)[number],
    ),
    isProtected: PROTECTED_ROLE_NAMES.includes(
      role.name as (typeof PROTECTED_ROLE_NAMES)[number],
    ),
    userCount: role._count.users,
    permissions: role.permissions.map((rp) => ({
      id: rp.permission.id,
      name: rp.permission.name,
      description: rp.permission.description,
    })),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

export class RbacService {
  constructor(private readonly repo = new RbacRepository()) {}

  async listPermissions() {
    const permissions = await this.repo.findAllPermissions();
    return permissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      description: permission.description,
    }));
  }

  async listRoles(tenantId: string) {
    const roles = await this.repo.findRolesByTenant(tenantId);
    return roles.map(formatRole);
  }

  async createRole(
    tenantId: string,
    data: { name: string; permissionIds: string[] },
  ) {
    const normalizedName = data.name.trim();

    if (
      SYSTEM_ROLE_NAMES.includes(
        normalizedName.toUpperCase() as (typeof SYSTEM_ROLE_NAMES)[number],
      )
    ) {
      throw new BadRequestException(
        'Cannot create a role with a reserved system name',
      );
    }

    await this.validatePermissionIds(data.permissionIds);

    try {
      const role = await this.repo.createRoleWithPermissions(
        tenantId,
        normalizedName,
        data.permissionIds,
      );
      return formatRole(role);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A role with this name already exists for this gym',
          ErrorCode.RESOURCE_ALREADY_EXISTS,
        );
      }
      throw error;
    }
  }

  async updateRole(
    tenantId: string,
    roleId: string,
    data: { name?: string; permissionIds?: string[] },
  ) {
    const existing = await this.repo.findRoleById(roleId, tenantId);

    if (!existing) {
      throw new NotFoundException('Role not found', ErrorCode.NOT_FOUND);
    }

    if (
      PROTECTED_ROLE_NAMES.includes(
        existing.name as (typeof PROTECTED_ROLE_NAMES)[number],
      )
    ) {
      throw new ForbiddenException('The OWNER role cannot be modified');
    }

    if (data.name) {
      const normalizedName = data.name.trim();
      if (
        SYSTEM_ROLE_NAMES.includes(
          normalizedName.toUpperCase() as (typeof SYSTEM_ROLE_NAMES)[number],
        ) &&
        normalizedName.toUpperCase() !== existing.name
      ) {
        throw new BadRequestException(
          'Cannot rename a role to a reserved system name',
        );
      }
    }

    if (data.permissionIds) {
      await this.validatePermissionIds(data.permissionIds);
    }

    try {
      const role = await this.repo.updateRoleWithPermissions(roleId, tenantId, {
        name: data.name?.trim(),
        permissionIds: data.permissionIds,
      });

      clearPermissionCacheForRole(roleId);

      return formatRole(role);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A role with this name already exists for this gym',
          ErrorCode.RESOURCE_ALREADY_EXISTS,
        );
      }
      throw error;
    }
  }

  async deleteRole(tenantId: string, roleId: string) {
    const existing = await this.repo.findRoleById(roleId, tenantId);

    if (!existing) {
      throw new NotFoundException('Role not found', ErrorCode.NOT_FOUND);
    }

    if (
      SYSTEM_ROLE_NAMES.includes(
        existing.name as (typeof SYSTEM_ROLE_NAMES)[number],
      )
    ) {
      throw new ForbiddenException('System roles cannot be deleted');
    }

    if (existing._count.users > 0) {
      throw new BadRequestException(
        'Cannot delete a role that is assigned to team members',
      );
    }

    await this.repo.deleteRole(roleId, tenantId);
    clearPermissionCacheForRole(roleId);
  }

  private async validatePermissionIds(permissionIds: string[]) {
    const uniqueIds = [...new Set(permissionIds)];

    if (uniqueIds.length !== permissionIds.length) {
      throw new BadRequestException('Duplicate permission IDs are not allowed');
    }

    const permissions = await this.repo.findPermissionsByIds(uniqueIds);

    if (permissions.length !== uniqueIds.length) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }
  }
}

export const rbacService = new RbacService();
