import {
  BadRequestException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { prisma } from '@/infra/db.js';
import {
  monthRange,
  parseDateOnly,
  previousMonthRange,
  resolvePaymentStatus,
  startOfUtcDay,
} from '../members/member-membership.utils.js';

function resolveRange(query: {
  from?: string;
  to?: string;
  range?: 'this_month' | 'last_month' | 'custom';
}): { from: Date; to: Date } {
  if (query.range === 'last_month') {
    return previousMonthRange();
  }

  if (query.from && query.to) {
    const from = parseDateOnly(query.from);
    const to = parseDateOnly(query.to);
    if (to < from) {
      throw new BadRequestException('End date must be on or after start date');
    }
    return { from, to };
  }

  return monthRange();
}

function trainingStatus(
  memberStatus: string,
  expiresAt: Date | null,
): 'ACTIVE' | 'INACTIVE' {
  if (memberStatus !== 'ACTIVE') {
    return 'INACTIVE';
  }
  if (!expiresAt) {
    return 'ACTIVE';
  }
  return startOfUtcDay(expiresAt) >= startOfUtcDay() ? 'ACTIVE' : 'INACTIVE';
}

export class StaffAttendanceService {
  async getStaffMetrics(
    tenantId: string,
    query: { from?: string; to?: string; range?: 'this_month' | 'last_month' | 'custom' },
  ) {
    const { from, to } = resolveRange(query);
    const team = await prisma.tenantUser.findMany({
      where: {
        tenantId,
        role: { in: ['STAFF', 'ADMIN'] },
      },
      select: {
        role: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const counts = await prisma.staffAttendance.groupBy({
      by: ['userId'],
      where: {
        tenantId,
        present: true,
        date: { gte: from, lte: to },
      },
      _count: { _all: true },
    });

    const countMap = new Map(counts.map((row) => [row.userId, row._count._all]));
    const totalDays = Math.round(
      (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      totalDaysInRange: totalDays,
      staff: team.map((member) => ({
        userId: member.user.id,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        email: member.user.email,
        role: member.role,
        isActive: member.user.isActive,
        daysPresent: countMap.get(member.user.id) ?? 0,
      })),
    };
  }

  async markAttendance(
    tenantId: string,
    data: { userId: string; date: string; present: boolean; notes?: string },
  ) {
    const tenantUser = await prisma.tenantUser.findFirst({
      where: { tenantId, userId: data.userId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!tenantUser) {
      throw new NotFoundException(
        'Team member not found in this gym',
        ErrorCode.NOT_FOUND,
      );
    }

    const trainer = await prisma.trainer.findFirst({
      where: { tenantId, userId: data.userId },
      select: { id: true },
    });

    const date = parseDateOnly(data.date);

    const record = await prisma.staffAttendance.upsert({
      where: {
        tenantId_userId_date: {
          tenantId,
          userId: data.userId,
          date,
        },
      },
      create: {
        tenantId,
        userId: data.userId,
        trainerId: trainer?.id ?? null,
        date,
        present: data.present,
        notes: data.notes,
        checkIn: new Date(),
      },
      update: {
        present: data.present,
        notes: data.notes,
        trainerId: trainer?.id ?? null,
      },
    });

    return {
      ...record,
      firstName: tenantUser.user.firstName,
      lastName: tenantUser.user.lastName,
      email: tenantUser.user.email,
      role: tenantUser.role,
    };
  }

  async getTrainerPerformance(
    trainerId: string,
    tenantId: string,
    query: { from?: string; to?: string; range?: 'this_month' | 'last_month' | 'custom' },
  ) {
    const trainer = await prisma.trainer.findFirst({
      where: { id: trainerId, tenantId },
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
            isActive: true,
          },
        },
        members: {
          where: { status: { not: 'DELETED' } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            membershipExpiresAt: true,
            paymentStatus: true,
            membershipPackage: {
              select: { id: true, name: true },
            },
          },
          orderBy: { firstName: 'asc' },
        },
      },
    });

    if (!trainer) {
      throw new NotFoundException('Trainer not found', ErrorCode.NOT_FOUND);
    }

    const { from, to } = resolveRange(query);
    const daysPresent = await prisma.staffAttendance.count({
      where: {
        tenantId,
        userId: trainer.userId,
        present: true,
        date: { gte: from, lte: to },
      },
    });

    const totalDaysInRange =
      Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      trainer: {
        id: trainer.id,
        specialization: trainer.specialization,
        bio: trainer.bio,
        userId: trainer.userId,
        user: trainer.user,
      },
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      totalDaysInRange,
      daysPresent,
      assignedMembers: trainer.members.map((member) => ({
        ...member,
        paymentStatus: resolvePaymentStatus(
          member.paymentStatus,
          member.membershipExpiresAt,
        ),
        trainingStatus: trainingStatus(member.status, member.membershipExpiresAt),
      })),
    };
  }

  async getTrainerOverview(tenantId: string) {
    const trainers = await prisma.trainer.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        specialization: true,
        bio: true,
        userId: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
          },
        },
        members: {
          where: { status: { not: 'DELETED' } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            membershipExpiresAt: true,
            membershipPackage: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return trainers.map((trainer) => ({
      ...trainer,
      assignedMemberCount: trainer.members.length,
      members: trainer.members.map((member) => ({
        ...member,
        trainingStatus: trainingStatus(member.status, member.membershipExpiresAt),
      })),
    }));
  }
}
