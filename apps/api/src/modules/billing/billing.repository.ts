import {
  BillingInterval,
  PlanName,
  Prisma,
} from '@/generated/prisma/client.js';
import { prisma } from '@/infra/db.js';

export class BillingRepository {
  async createFreeSubscription(
    tenantId: string,
    planId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || prisma;

    return client.subscription.create({
      data: {
        tenantId,
        planId,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
      },
    });
  }

  async getSubscriptionWithPlan(tenantId: string) {
    return prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });
  }

  async updatePlan(tenantId: string, planId: string) {
    return prisma.subscription.update({
      where: { tenantId },
      data: {
        planId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(
          new Date().setMonth(new Date().getMonth() + 1),
        ),
        status: 'ACTIVE',
      },
    });
  }

  async getTenantWithSubscription(tenantId: string) {
    return prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: true,
      },
    });
  }

  async getPlanByNameAndInterval(name: PlanName, interval: BillingInterval) {
    return prisma.plan.findUnique({
      where: {
        name_interval: {
          name,
          interval,
        },
      },
    });
  }

  async getPlanById(planId: string) {
    return prisma.plan.findUnique({
      where: { id: planId },
    });
  }

   async getPlanFeaturesByTenant(tenantId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!sub || sub.status !== 'ACTIVE') {
      throw new Error('No active subscription');
    }

    return sub.plan.features as any;
  }
}
