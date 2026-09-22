import { NotFoundException } from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { Prisma } from '@/generated/prisma/client.js';
import { prisma } from '@/infra/db.js';

export const memberListSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  packageId: true,
  membershipStartDate: true,
  membershipExpiresAt: true,
  paymentStatus: true,
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
  membershipPackage: {
    select: {
      id: true,
      name: true,
      durationDays: true,
      price: true,
      currency: true,
    },
  },
} satisfies Prisma.MemberSelect;

export type MemberListFilter = {
  packageId?: string;
  paymentStatus?: 'PAID' | 'PENDING' | 'OVERDUE' | 'UNPAID';
  expirationWindow?: 'expiring_7' | 'expiring_today' | 'expired';
  search?: string;
};

export class MemberRepository {
  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    dateOfBirth?: Date | null;
    assignedTrainerId?: string | null;
    tenantId: string;
    packageId: string;
    membershipStartDate: Date;
    membershipExpiresAt: Date;
    paymentStatus: 'PAID' | 'PENDING';
  }) {
    return prisma.member.create({
      data,
      select: memberListSelect,
    });
  }

  async findMany(
    skip: number,
    take: number,
    tenantId: string,
    filter: MemberListFilter = {},
  ) {
    const where = this.buildWhere(tenantId, filter);

    return prisma.member.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: memberListSelect,
    });
  }

  async count(tenantId: string, filter: MemberListFilter = {}) {
    return prisma.member.count({
      where: this.buildWhere(tenantId, filter),
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
        ...memberListSelect,
        dateOfBirth: true,
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
      select: memberListSelect,
    });
  }

  async softDelete(id: string, tenantId: string, _userId: string) {
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
      where: { id: existing.id, tenantId },
      data: {
        status: 'DELETED',
      },
    });
  }

  async getAttendanceHistory(memberId: string, tenantId: string) {
    return prisma.attendance.findMany({
      where: { memberId, tenantId },
      orderBy: { checkIn: 'desc' },
      select: {
        id: true,
        checkIn: true,
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

  private buildWhere(
    tenantId: string,
    filter: MemberListFilter,
  ): Prisma.MemberWhereInput {
    const now = new Date();
    const startToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const inSevenDays = new Date(startToday);
    inSevenDays.setUTCDate(inSevenDays.getUTCDate() + 7);
    const endToday = new Date(startToday);
    endToday.setUTCDate(endToday.getUTCDate() + 1);

    const where: Prisma.MemberWhereInput = {
      tenantId,
      status: { not: 'DELETED' },
    };

    const and: Prisma.MemberWhereInput[] = [];

    if (filter.packageId) {
      where.packageId = filter.packageId;
    }

    if (filter.search) {
      const q = filter.search.trim();
      and.push({
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (filter.expirationWindow === 'expired') {
      and.push({ membershipExpiresAt: { lt: startToday } });
    } else if (filter.expirationWindow === 'expiring_today') {
      and.push({ membershipExpiresAt: { gte: startToday, lt: endToday } });
    } else if (filter.expirationWindow === 'expiring_7') {
      and.push({ membershipExpiresAt: { gte: startToday, lte: inSevenDays } });
    }

    if (filter.paymentStatus === 'PAID') {
      and.push({
        paymentStatus: 'PAID',
        OR: [{ membershipExpiresAt: null }, { membershipExpiresAt: { gte: startToday } }],
      });
    } else if (filter.paymentStatus === 'PENDING') {
      and.push({
        paymentStatus: 'PENDING',
        OR: [{ membershipExpiresAt: null }, { membershipExpiresAt: { gte: startToday } }],
      });
    } else if (filter.paymentStatus === 'OVERDUE') {
      and.push({ membershipExpiresAt: { lt: startToday } });
    } else if (filter.paymentStatus === 'UNPAID') {
      and.push({
        OR: [
          { paymentStatus: 'PENDING' },
          { membershipExpiresAt: { lt: startToday } },
        ],
      });
    }

    if (and.length > 0) {
      where.AND = and;
    }

    return where;
  }
}
