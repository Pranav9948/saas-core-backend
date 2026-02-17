import { prisma } from '@/infra/db.js';
import { convertUTCToIST } from '@/utils/date.util.js';

export class AttendanceRepository {
  async findExistingCheckIn(
    memberId: string,
    startOfDay: Date,
    endOfDay: Date,
  ) {
    return prisma.attendance.findFirst({
      where: {
        memberId,
        checkIn: { gte: startOfDay, lte: endOfDay },
      },
    });
  }

  async create(data: { memberId: string; deviceInfo?: string }) {
    return prisma.attendance.create({
      data,
      include: {
        member: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findByDateRange(start: Date, end: Date) {
    return prisma.attendance.findMany({
      where: { checkIn: { gte: start, lte: end } },
      include: {
        member: { select: { firstName: true, lastName: true, status: true } },
      },
      orderBy: { checkIn: 'desc' },
    });
  }

  async getStats(memberId: string) {
    const totalVisits = await prisma.attendance.count({ where: { memberId } });
    const lastVisit = await prisma.attendance.findFirst({
      where: { memberId },
      orderBy: { checkIn: 'desc' },
    });

    return {
      totalVisits,
      lastVisit: convertUTCToIST(lastVisit?.checkIn || null),
    };
  }
}
