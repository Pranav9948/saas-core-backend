import { Prisma } from '@/generated/prisma/client.js';
import { prisma } from '../../infra/db.js';
import { getTenantPrisma } from '@/infra/tenant-prisma.js';
import { logger } from '@/core/logger.js';

export class TenantRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx || prisma;
  }

  async createTenantWithOwner(data: { tenant: any; user: any }) {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: data.tenant,
      });

      const user = await tx.user.create({
        data: data.user,
      });

      await tx.tenantUser.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: 'OWNER',
        },
      });

      return { tenant, user };
    });
  }

  async slugExists(slug: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    return !!tenant;
  }

  async findById(tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        contactEmail: true,
        contactPhone: true,
        city: true,
        country: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findTenantByUserId(userId: string) {
    return prisma.tenantUser.findFirst({
      where: {
        userId: userId,
      },
      include: {
        tenant: true,
      },
    });
  }

  async updateTenant(tenantId: string, data: any) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.tenant.update({
      where: {
        id: tenantId,
      },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        contactEmail: true,
        contactPhone: true,
        address: true,
        city: true,
        country: true,
        updatedAt: true,
      },
    });
  }
}
