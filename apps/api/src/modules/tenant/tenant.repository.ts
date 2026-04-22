import { BillingRepository } from './../billing/billing.repository.js';
import { Prisma } from '@/generated/prisma/client.js';
import { prisma } from '../../infra/db.js';
import { getTenantPrisma } from '@/infra/tenant-prisma.js';
import { logger } from '@/core/logger.js';
import { sendEmail } from '@/utils/mail.js';
import { getInviteUserTemplate } from '@/utils/templates.js';
import {
  InternalException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { stripe } from '../billing/stripe.service.js';

export class TenantRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx || prisma;
  }

  constructor(private billingRepo = new BillingRepository()) {}

  async createTenantWithOwner(data: { tenant: any; user: any }) {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: data.tenant,
      });

      const user = await tx.user.create({
        data: data.user,
      });

      const ownerRole = await tx.role.findFirst({
        where: {
          name: 'OWNER',
        },
      });

      await tx.tenantUser.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: 'OWNER',
          roleId: ownerRole?.id,
        },
      });

      const freePlan = await prisma.plan.findFirst({
        where: { name: 'FREE' },
      });

      if (!freePlan) {
        throw new NotFoundException('plan not configured', ErrorCode.NOT_FOUND);
      }

      await this.billingRepo.createFreeSubscription(tenant.id, freePlan.id, tx);

      const customer = await stripe.customers.create({
        name: tenant.name,
        metadata: {
          tenantId: tenant.id,
        },
      });

      await tx.tenant.update({
        where: { id: tenant.id },
        data: {
          stripeCustomerId: customer.id,
        },
      });

      return { tenant, user };
    });
  }

  async slugExists(slug: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    return !!tenant;
  }

  async findById(tenantId: string) {
    return prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        contactEmail: true,
        contactPhone: true,
        city: true,
        country: true,
        createdAt: true,
        updatedAt: true,

         subscriptions: {
         select: {
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,

          plan: {
            select: {
              id: true,
              name: true,
              interval: true,
              price: true,
              features: true,
            },
          },
        },
      },
    }

    });
  }

  async findTenantUser(userId: string, tenantId: string) {
    return prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });
  }

  async findTenantByUserId(userId: string) {
    return prisma.tenantUser.findFirst({
      where: { userId },
    });
  }

  async updateTenant(tenantId: string, data: any) {
    return prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        contactEmail: true,
        contactPhone: true,
        address: true,
        city: true,
        country: true,
        updatedAt: true,
      },
    });
  }

  async updateLogo(tenantId: string, logoUrl: string) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data: {
        logoUrl,
      },
    });
  }

  async userExistsInTenant(email: string, tenantId: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenants: true,
      },
    });

    if (!user) return false;

    return user.tenants.some((t) => t.tenantId === tenantId);
  }

  async createInviteToken(data: any) {
    return prisma.inviteToken.create({
      data,
    });
  }

  async createUserWithTenant({
    tenantId,
    user,
    role,
  }: {
    tenantId: string;
    user: any;
    role: string;
  }) {
    logger.info(
      `createUserWithTenant :: tenantId:${tenantId},user:${user},role:${role} `,
    );

    return prisma.$transaction(async (tx) => {
      let existingUser = await tx.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        existingUser = await tx.user.create({ data: user });
      }

      const roleRecord = await tx.role.findFirst({
        where: {
          name: role,
        },
      });

      logger.info(`roleRecord : ${roleRecord}`);

      if (!roleRecord) {
        throw new Error(`Role '${role}' not found for this tenant`);
      }

      await tx.tenantUser.create({
        data: {
          userId: existingUser.id,
          tenantId,
          role,
          roleId: roleRecord.id,
        },
      });

      return existingUser;
    });
  }

  async sendInviteEmail(
    email: string,
    link: string,
    name: string,
    gymName: string,
    role: string,
  ) {
    try {
      const html = getInviteUserTemplate(link, name, gymName, role);
      await sendEmail(email, 'send invite mail', html);
    } catch (error) {
      throw new InternalException('Email could not be sent', error);
    }
  }

  async findInviteByToken(token: string) {
    return prisma.inviteToken.findUnique({
      where: { token },
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(data: any) {
    return prisma.user.create({
      data,
    });
  }

  async addUserToTenant(data: any) {
    return prisma.tenantUser.create({
      data,
    });
  }

  async deleteInvite(id: string) {
    return prisma.inviteToken.delete({
      where: { id },
    });
  }

  async updatePlan(
    tenantId: string,
    newPlanId: string,
    interval: 'MONTHLY' | 'YEARLY',
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.subscription.findUnique({
        where: { tenantId },
        include: { plan: true },
      });

      if (!existing) {
        throw new Error('Subscription not found');
      }

      if (existing.planId === newPlanId) {
        throw new Error('You are already on this plan');
      }

      const newPlan = await tx.plan.findUnique({
        where: { id: newPlanId },
      });

      if (!newPlan) {
        throw new Error('Target plan not found');
      }

      if (newPlan.name === 'FREE') {
        throw new Error('Cannot downgrade to FREE plan');
      }

      const now = new Date();

      let periodEnd: Date;

      if (interval === 'MONTHLY') {
        periodEnd = new Date(now.setMonth(now.getMonth() + 1));
      } else {
        periodEnd = new Date(now.setFullYear(now.getFullYear() + 1));
      }

      const updated = await tx.subscription.update({
        where: { tenantId },
        data: {
          planId: newPlanId,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        },
        include: {
          plan: true,
        },
      });

      return updated;
    });
  }
}
