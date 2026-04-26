import { prisma } from '../../../infra/db.js';
import { logger } from '../../../core/logger.js';

export const analyticsProcessor = {
  async process(data: { date: string }) {
    const targetDate = new Date(data.date);

    const start = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
    );

    const end = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate() + 1,
    );

    logger.info(`start ${start} end ${end}`);

    const tenants = await prisma.tenant.findMany({
      select: { id: true },
    });

    for (const tenant of tenants) {
      const count = await prisma.attendance.count({
        where: {
          tenantId: tenant.id,
          date: {
            gte: start,
            lt: end,
          },
        },
      });
      logger.info(`count in analytics processor ${count}`);

      // 3️⃣ upsert (idempotent)
      await prisma.attendanceDailyStats.upsert({
        where: {
          tenantId_date: {
            tenantId: tenant.id,
            date: start,
          },
        },
        update: {
          totalCheckIns: count,
        },
        create: {
          tenantId: tenant.id,
          date: start,
          totalCheckIns: count,
        },
      });
    }

    logger.info(` Daily analytics computed date:  ${start}`);
  },
};
