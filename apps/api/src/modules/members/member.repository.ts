import { NotFoundException } from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { Prisma } from '@/generated/prisma/client.js';
import { prisma } from '@/infra/db.js';
import { getTenantPrisma } from '@/infra/tenant-prisma.js';

export class MemberRepository {
  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    dateOfBirth?: Date | null;
    assignedTrainerId?: string | null;
    tenantId: string;
  }) {
    return prisma.member.create({
      data,

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,

        assignedTrainer: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async findMany(skip: number, take: number, tenantId: string) {
    return prisma.member.findMany({
      where: {
        tenantId,
        status: { not: 'DELETED' },
      },

      skip,
      take,

      orderBy: { createdAt: 'desc' },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,

        assignedTrainer: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async count(tenantId: string) {
    return prisma.member.count({
      where: {
        tenantId,
        status: { not: 'DELETED' },
      },
    });
  }
  async findById(id: string, tenantId: string) {
    return prisma.member.findFirst({
      where: {
        id,
        tenantId,
        status: { not: 'DELETED' },
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,

        assignedTrainer: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },

        _count: {
          select: {
            attendances: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.MemberUpdateInput, tenantId: string) {
    const existing = await prisma.member.findFirst({
      where: {
        id,
        tenantId,
        status: { not: 'DELETED' },
      },
    });

    if (!existing) {
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);
    }

    return prisma.member.update({
      where: { id: existing.id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,

        assignedTrainer: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async softDelete(id: string, tenantId: string, userId: string) {
    const existing = await prisma.member.findFirst({
      where: {
        id,
        tenantId,
        status: { not: 'DELETED' },
      },
    });

    if (!existing) {
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);
    }

    return prisma.member.update({
      where: { id: existing.id },
      data: {
        status: 'DELETED',
      },
    });
  }

  async getAttendanceHistory(memberId: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.attendance.findMany({
      where: { memberId },
      orderBy: { checkIn: 'desc' },
      select: {
        id: true,
        checkIn: true,
        // Include trainer who was on duty if needed
      },
    });
  }

  async findByEmail(email: string, tenantId: string) {
    return prisma.member.findFirst({
      where: {
        email,
        tenantId,
      },
    });
  }
}
