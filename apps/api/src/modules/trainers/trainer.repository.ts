import { Prisma } from '@/generated/prisma/client.js';
import { prisma } from '@/infra/db.js';
import { getTenantPrisma } from '@/infra/tenant-prisma.js';

export class TrainerRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx || prisma;
  }

  async findById(id: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);
    return tenantPrisma.trainer.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findByUserId(userId: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);
    return tenantPrisma.trainer.findUnique({ where: { userId } });
  }

  async findAll(skip: number, take: number, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);
    return tenantPrisma.trainer.findMany({
      skip,
      take,
      select: {
        id: true,
        specialization: true,
        user: { select: { firstName: true, lastName: true, email: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProfile(
    data: Prisma.TrainerCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).trainer.create({
      data,
      select: {
        id: true,
        specialization: true,
        bio: true,
        userId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        createdAt: true,
      },
    });
  }

  async updateProfile(
    id: string,
    data: Prisma.TrainerUpdateInput,
    tenantId: string,
  ) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);
    return tenantPrisma.trainer.update({ where: { id }, data });
  }

  async delete(id: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);
    return tenantPrisma.trainer.delete({ where: { id } });
  }

  async update(id: string, data: any, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);
    return tenantPrisma.trainer.update({
      where: { id },
      data,
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  async findMembers(trainerId: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);
    return tenantPrisma.member.findMany({
      where: { assignedTrainerId: trainerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        email: true,
      },
    });
  }
}
