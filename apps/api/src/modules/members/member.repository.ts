import { Prisma } from '@/generated/prisma/client.js';
import { prisma } from '@/infra/db.js';

export class MemberRepository {
  async create(data: Prisma.MemberCreateInput) {
    return prisma.member.create({
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

  async findMany(skip: number, take: number, filter: any = {}) {
    return prisma.member.findMany({
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

  async findById(id: string) {
    return prisma.member.findUnique({
      where: { id },
      include: {
        assignedTrainer: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        _count: { select: { attendances: true } },
      },
    });
  }

  async update(id: string, data: Prisma.MemberUncheckedUpdateInput) {
    return prisma.member.update({
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

  async softDelete(id: string) {
    return prisma.member.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  }

  async getAttendanceHistory(memberId: string) {
    return prisma.attendance.findMany({
      where: { memberId },
      orderBy: { checkIn: 'desc' },
      select: {
        id: true,
        checkIn: true,
        // Include trainer who was on duty if needed
      },
    });
  }
}
