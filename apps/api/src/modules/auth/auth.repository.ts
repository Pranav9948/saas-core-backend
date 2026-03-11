import { Prisma } from '@/generated/prisma/client.js';
import { prisma } from '../../infra/db.js';
import { getTenantPrisma } from '@/infra/tenant-prisma.js';
import { logger } from '@/core/logger.js';

export class UserRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx || prisma;
  }

  async findByEmail(email: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.user.findUnique({ where: { email } });
  }

  async findById(id: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.user.findUnique({ where: { id } });
  }

  async createUser(tenantId: string, data: Prisma.UserCreateInput) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }

  async updateResetToken(
    id: string,
    token: string | null,
    expiry: Date | null,
    tenantId: string,
  ) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.user.update({
      where: { id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });
  }

  async updatePassword(id: string, passwordHash: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.user.update({
      where: { id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  }

  async findUserByResetToken(token: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });
  }

  // --- Refresh Token Methods ---

  async createRefreshToken(
    userId: string,
    token: string,
    expiryAt: Date,
    tenantId: string,
  ) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.refreshToken.create({
      data: { userId, token, expiryAt },
    });
  }

  async findRefreshToken(token: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.refreshToken.findUnique({ where: { token } });
  }

  async deleteRefreshToken(token: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.refreshToken.deleteMany({ where: { token } });
  }

  async deleteAllUserRefreshTokens(userId: string, tenantId: string) {
    const tenantPrisma = getTenantPrisma(prisma, tenantId);

    return tenantPrisma.refreshToken.deleteMany({ where: { userId } });
  }

  async findByEmailGlobal(email: string) {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async updateRole(
    id: string,
    role: string,
    tenantId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).user.update({
      where: {
        id,
        tenantId,
      },
      data: { role },
    });
  }
}
