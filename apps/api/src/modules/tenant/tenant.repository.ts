import { Prisma } from '@/generated/prisma/client.js';
import { prisma } from '../../infra/db.js';
import { getTenantPrisma } from '@/infra/tenant-prisma.js';
import { logger } from '@/core/logger.js';
import { sendEmail } from '@/utils/mail.js';
import { getInviteUserTemplate } from '@/utils/templates.js';
import { InternalException } from '@/exceptions/exceptions.js';

export class TenantRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx || prisma;
  }

  async createTenantWithOwner(data: { tenant: any; user: any }) {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: data.tenant,
      });

      const user = await tx.user.create({
        data: data.user,
      });

      await tx.tenantUser.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: 'OWNER',
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
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.tenant.findUnique({
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
      },
    });
  }

  async findTenantByUserId(userId: string) {
    return prisma.tenantUser.findFirst({
      where: {
        userId: userId,
      },
      include: {
        tenant: true,
      },
    });
  }

  async updateTenant(tenantId: string, data: any) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.tenant.update({
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
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.tenant.update({
      where: { id: tenantId },
      data: {
        logoUrl,
      },
    });
  }

  async userExistsInTenant(email: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);
    const user = await tenantPrisma.user.findUnique({
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
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.$transaction(async (tx) => {
      let existingUser = await tx.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        existingUser = await tx.user.create({ data: user });
      }

      await tx.tenantUser.create({
        data: {
          userId: existingUser.id,
          tenantId,
          role,
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
}
