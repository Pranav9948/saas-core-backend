import type { PlanName } from '@/generated/prisma/client.js';
import { prisma } from '@/infra/db.js';
import { Feature } from './feature.enum.js';

export class FeatureUsageRepository {
  async tenantExists(tenantId: string) {
    return prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
  }

  async getSubscriptionPlanName(tenantId: string): Promise<PlanName | null> {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      select: {
        plan: {
          select: { name: true },
        },
      },
    });

    return subscription?.plan.name ?? null;
  }

  async countMembers(tenantId: string) {
    return prisma.member.count({
      where: {
        tenantId,
        status: { not: 'DELETED' },
      },
    });
  }

  async countTrainers(tenantId: string) {
    return prisma.trainer.count({
      where: { tenantId },
    });
  }

  async countStaff(tenantId: string) {
    return prisma.tenantUser.count({
      where: {
        tenantId,
        role: { in: ['STAFF', 'ADMIN'] },
      },
    });
  }

  async countByFeature(tenantId: string, feature: Feature) {
    switch (feature) {
      case Feature.MEMBERS:
        return this.countMembers(tenantId);
      case Feature.TRAINERS:
        return this.countTrainers(tenantId);
      case Feature.STAFF:
        return this.countStaff(tenantId);
    }
  }

  async countAllUsage(tenantId: string) {
    const [members, trainers, staff] = await Promise.all([
      this.countMembers(tenantId),
      this.countTrainers(tenantId),
      this.countStaff(tenantId),
    ]);

    return { members, trainers, staff };
  }
}
