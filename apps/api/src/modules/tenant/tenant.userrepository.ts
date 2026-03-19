import { Prisma } from '@/generated/prisma/client.js';
import { prisma } from '@/infra/db.js';

export class TenantUserRepository {
  async findUserInTenant(userId: string, tenantId: string) {
    return prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });
  }

  async updateRole(
    userId: string,
    tenantId: string,
    role: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || prisma;

    return client.tenantUser.update({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
      data: { role },
    });
  }
}
