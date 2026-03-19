import { NotFoundException } from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { Prisma } from '@/generated/prisma/client.js';
import { prisma } from '@/infra/db.js';
import { getTenantPrisma } from '@/infra/tenant-prisma.js';

export class TrainerRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx || prisma;
  }

  async findById(id: string, tenantId: string) {
    return prisma.trainer.findFirst({
      where: {
        id,
        tenantId,
      },

      select: {
        id: true,
        specialization: true,
        bio: true,
        createdAt: true,
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

        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  }

  async findAll(skip: number, take: number, tenantId: string) {
    return prisma.trainer.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },

      select: {
        id: true,
        specialization: true,
        bio: true,
        createdAt: true,

        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },

        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  }

  async count(tenantId: string) {
    return prisma.trainer.count({
      where: { tenantId },
    });
  }

  async findByUserId(userId: string, tenantId: string) {
    return prisma.trainer.findFirst({
      where: {
        userId,
        tenantId,
      },
    });
  }

  async createProfile(
    data: {
      userId: string;
      tenantId: string;
      specialization?: string | null;
      bio?: string | null;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || prisma;

    return client.trainer.create({
      data,
      select: {
        id: true,
        specialization: true,
        bio: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
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

  async delete(id: string, tenantId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;

    const result = await client.trainer.deleteMany({
      where: {
        id,
        tenantId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Trainer not found', ErrorCode.NOT_FOUND);
    }

    return true;
  }

  async update(
    id: string,
    data: {
      specialization?: string;
      bio?: string;
    },
    tenantId: string,
  ) {
    const result = await prisma.trainer.updateMany({
      where: { id, tenantId },
      data,
    });

    if (result.count === 0) {
      throw new NotFoundException('Trainer not found', ErrorCode.NOT_FOUND);
    }

    return prisma.trainer.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        specialization: true,
        bio: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findMembers(
    trainerId: string,
    tenantId: string,
    skip: number,
    take: number,
  ) {
    return prisma.member.findMany({
      where: {
        assignedTrainerId: trainerId,
        tenantId,
      },

      skip,
      take,

      orderBy: {
        createdAt: 'desc',
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async countMembers(trainerId: string, tenantId: string) {
    return prisma.member.count({
      where: {
        assignedTrainerId: trainerId,
        tenantId,
      },
    });
  }
}
