import { prisma } from '@/infra/db.js';

export class GoalRepository {
  async create(data: {
    memberId: string;
    tenantId: string;
    goalType: 'GAIN' | 'LOSS';
    currentWeight: number;
    targetWeight: number;
    durationWeeks: number;
    height: number;
  }) {
    return prisma.memberGoal.create({
      data,
    });
  }

  async deactivateExistingGoals(memberId: string, tenantId: string) {
    return prisma.memberGoal.updateMany({
      where: {
        memberId,
        tenantId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }

  async findActiveByMember(memberId: string, tenantId: string) {
    return prisma.memberGoal.findFirst({
      where: {
        memberId,
        tenantId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByMember(memberId: string, tenantId: string) {
    return prisma.memberGoal.findMany({
      where: {
        memberId,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
