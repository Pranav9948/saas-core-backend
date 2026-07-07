import { SuperAdminSecurity } from '@/core/super-admin.security.js';
import { NotFoundException } from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { Prisma } from '@/generated/prisma/client.js';
import { prisma } from '@/infra/db.js';

export class SuperAdminRepository {
  async createSuperAdmin(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const hashedPassword = await SuperAdminSecurity.hashPassword(data.password);

    return prisma.superAdmin.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'SUPER_ADMIN',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.superAdmin.findFirst({
      where: { email },
    });
  }

  async findById(id: string) {
    return prisma.superAdmin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
      },
    });
  }

  async createRefreshToken(
    superAdminId: string,
    token: string,
    expiresAt: Date,
  ) {
    return prisma.superAdminRefreshToken.create({
      data: {
        superAdminId,
        token,
        expiresAt,
      },
    });
  }

  async findRefreshToken(token: string) {
    return prisma.superAdminRefreshToken.findUnique({
      where: { token },
      include: {
        superAdmin: true,
      },
    });
  }

  async deleteRefreshToken(token: string) {
    return prisma.superAdminRefreshToken.delete({
      where: { token },
    });
  }

  async updateLastLogin(id: string) {
    return prisma.superAdmin.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async countSuperAdmins() {
    return prisma.superAdmin.count();
  }

  async createPlan(data: Prisma.PlanCreateInput) {
    return prisma.plan.create({
      data,
    });
  }

  async findAllPlans() {
    return prisma.plan.findMany({
      orderBy: { price: 'asc' },
    });
  }

  async findPlanById(id: string) {
    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found', ErrorCode.NOT_FOUND);
    }

    return plan;
  }

  async updatePlan(id: string, data: Prisma.PlanUpdateInput) {
    return prisma.plan.update({
      where: { id },
      data,
    });
  }

  async deletePlan(id: string) {
    return prisma.plan.delete({
      where: { id },
    });
  }

  async getPlanById(id: string) {
    return prisma.plan.findUnique({
      where: { id },
    });
  }
}

export const superAdminRepo = new SuperAdminRepository();
