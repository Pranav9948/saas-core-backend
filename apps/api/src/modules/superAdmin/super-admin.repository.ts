import { SuperAdminSecurity } from '@/core/super-admin.security.js';
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
    return prisma.superAdmin.findUnique({
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
}

export const superAdminRepo = new SuperAdminRepository();
