import { Prisma } from '@/generated/prisma/client.js';
import { prisma } from '@/infra/db.js';
import { getTenantPrisma } from '@/infra/tenant-prisma.js';

export class MemberRepository {
  async create(data: Prisma.MemberCreateInput, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.member.create({
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      },
      include: {
        assignedTrainer: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
  }

  async findMany(
    skip: number,
    take: number,
    filter: any = {},
    tenantId: string,
  ) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.member.findMany({
      where: { ...filter, status: { not: 'DELETED' } }, // Soft delete filter
      skip,
      take,
      include: {
        assignedTrainer: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.member.findUnique({
      where: { id },
      include: {
        assignedTrainer: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        _count: { select: { attendances: true } },
      },
    });
  }

  async update(
    id: string,
    data: Prisma.MemberUncheckedUpdateInput,
    tenantId: string,
  ) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.member.update({
      where: { id },
      data,
      include: {
        assignedTrainer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  async softDelete(id: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.member.update({
      where: { id },
      data: { status: 'DELETED' },
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
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.member.findUnique({
      where: { email },
    });
  }
}
