import { prisma } from '@/infra/db.js';
import { convertUTCToIST } from '@/utils/date.util.js';

export class AttendanceRepository {
  async findExistingCheckIn(
    memberId: string,
    startOfDay: Date,
    endOfDay: Date,
    tenantId: string,
  ) {
    return prisma.attendance.findFirst({
      where: {
        memberId,
        tenantId,
        checkIn: { gte: startOfDay, lte: endOfDay },
      },
    });
  }

  async create(data: {
    memberId: string;
    tenantId: string;
    deviceInfo?: string;
    date: Date;
  }) {
    return prisma.attendance.create({
      data: {
        memberId: data.memberId,
        tenantId: data.tenantId,
        deviceInfo: data.deviceInfo,
        date: data.date,
      },
      select: {
        id: true,
        checkIn: true,
        date: true,
        deviceInfo: true,
        member: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findByDateRange(start: Date, end: Date, tenantId: string) {
    return prisma.attendance.findMany({
      where: { tenantId, checkIn: { gte: start, lte: end } },
      include: {
        member: { select: { firstName: true, lastName: true, status: true } },
      },
      orderBy: { checkIn: 'desc' },
    });
  }

  async getStats(memberId: string, tenantId: string) {
    const totalVisits = await prisma.attendance.count({
      where: { tenantId, memberId },
    });
    const lastVisit = await prisma.attendance.findFirst({
      where: { memberId, tenantId },
      orderBy: { checkIn: 'desc' },
    });

    return {
      totalVisits,
      lastVisit: convertUTCToIST(lastVisit?.checkIn || null),
    };
  }
}
