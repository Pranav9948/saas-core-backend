import {
  BillingInterval,
  PlanName,
  Prisma,
  SubscriptionStatus,
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

  async getTenantCheckoutContext(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        stripeCustomerId: true,
        subscriptions: {
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!tenant) {
      return null;
    }

    return {
      id: tenant.id,
      name: tenant.name,
      stripeCustomerId: tenant.stripeCustomerId,
      subscription: tenant.subscriptions[0] ?? null,
    };
  }

  async updateStripeCustomerId(tenantId: string, stripeCustomerId: string) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId },
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

  async findPlanByStripePriceId(stripePriceId: string) {
    return prisma.plan.findUnique({
      where: { stripePriceId },
    });
  }

  async findTenantByStripeCustomerId(stripeCustomerId: string) {
    return prisma.tenant.findUnique({
      where: { stripeCustomerId },
      select: { id: true, stripeCustomerId: true },
    });
  }

  async findSubscriptionByStripeSubscriptionId(stripeSubscriptionId: string) {
    return prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
      include: { plan: true },
    });
  }

  async upsertSubscriptionByTenant(
    data: {
      tenantId: string;
      planId: string;
      stripeCustomerId: string | null;
      stripeSubscriptionId: string | null;
      status: SubscriptionStatus;
      currentPeriodStart: Date | null;
      currentPeriodEnd: Date | null;
      cancelAtPeriodEnd: boolean;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;
    const {
      tenantId,
      planId,
      stripeCustomerId,
      stripeSubscriptionId,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    } = data;

    return client.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId,
        planId,
        stripeCustomerId,
        stripeSubscriptionId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
      },
      update: {
        planId,
        stripeCustomerId,
        stripeSubscriptionId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
      },
    });
  }

  async updateSubscriptionByStripeId(
    stripeSubscriptionId: string,
    data: {
      planId?: string;
      stripeCustomerId?: string | null;
      status?: SubscriptionStatus;
      currentPeriodStart?: Date | null;
      currentPeriodEnd?: Date | null;
      cancelAtPeriodEnd?: boolean;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.subscription.update({
      where: { stripeSubscriptionId },
      data,
    });
  }

  async ensureTenantStripeCustomerId(
    tenantId: string,
    stripeCustomerId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? prisma;

    return client.tenant.updateMany({
      where: {
        id: tenantId,
        stripeCustomerId: null,
      },
      data: { stripeCustomerId },
    });
  }

  /**
   * Single catalog fetch: tenant existence + subscription planId + all plans.
   * Two parallel queries — no Stripe calls.
   */
  async getBillingPlansCatalog(tenantId: string) {
    const [tenant, plans] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          subscriptions: {
            take: 1,
            select: { planId: true },
          },
        },
      }),
      prisma.plan.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          interval: true,
          features: true,
          stripePriceId: true,
        },
        orderBy: [{ price: 'asc' }, { interval: 'asc' }],
      }),
    ]);

    return {
      tenant,
      plans,
      subscriptionPlanId: tenant?.subscriptions[0]?.planId ?? null,
    };
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
