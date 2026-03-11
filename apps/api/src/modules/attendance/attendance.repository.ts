import { prisma } from '@/infra/db.js';
import { getTenantPrisma } from '@/infra/tenant-prisma.js';
import { convertUTCToIST } from '@/utils/date.util.js';

export class AttendanceRepository {
  async findExistingCheckIn(
    memberId: string,
    startOfDay: Date,
    endOfDay: Date,
    tenantId: string,
  ) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.attendance.findFirst({
      where: {
        memberId,
        checkIn: { gte: startOfDay, lte: endOfDay },
      },
    });
  }

  async create(data: {
    memberId: string;
    deviceInfo?: string;
    tenantId: string;
  }) {
    const { tenantId, ...attendanceData } = data;
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.attendance.create({
      data: attendanceData,
      include: {
        member: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findByDateRange(start: Date, end: Date, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.attendance.findMany({
      where: { checkIn: { gte: start, lte: end } },
      include: {
        member: { select: { firstName: true, lastName: true, status: true } },
      },
      orderBy: { checkIn: 'desc' },
    });
  }

  async getStats(memberId: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    const totalVisits = await tenantPrisma.attendance.count({
      where: { memberId },
    });
    const lastVisit = await tenantPrisma.attendance.findFirst({
      where: { memberId },
      orderBy: { checkIn: 'desc' },
    });

    return {
      totalVisits,
      lastVisit: convertUTCToIST(lastVisit?.checkIn || null),
    };
  }
}
