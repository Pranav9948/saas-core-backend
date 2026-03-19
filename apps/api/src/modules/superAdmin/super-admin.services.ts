import { SuperAdminSecurity } from '@/core/super-admin.security.js';
import {
  BadRequestException,
  UnauthorizedException,
} from '@/exceptions/exceptions.js';
import { superAdminRepo } from './super-admin.repository.js';
import { prisma } from '@/infra/db.js';

class SuperAdminService {
  async createInitialSuperAdmin(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    // Check if any super admin already exists
    const count = await superAdminRepo.countSuperAdmins();

    if (count > 0) {
      throw new BadRequestException(
        'Super admin already exists. Setup is complete.',
      );
    }

    const superAdmin = await superAdminRepo.createSuperAdmin(data);

    return {
      id: superAdmin.id,
      email: superAdmin.email,
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
      message:
        'Initial super admin created successfully. Please save these credentials securely.',
    };
  }

  async login(email: string, password: string) {
    const superAdmin = await superAdminRepo.findByEmail(email);

    if (!superAdmin || !superAdmin.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await SuperAdminSecurity.comparePassword(
      password,
      superAdmin.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const accessToken = SuperAdminSecurity.generateAccessToken({
      id: superAdmin.id,
      email: superAdmin.email,
      role: 'SUPER_ADMIN',
    });

    const refreshToken = SuperAdminSecurity.generateRefreshToken({
      id: superAdmin.id,
    });

    // Save refresh token
    await superAdminRepo.createRefreshToken(
      superAdmin.id,
      refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

    // Update last login
    await superAdminRepo.updateLastLogin(superAdmin.id);

    return {
      superAdmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        role: superAdmin.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async rotateRefreshToken(oldToken: string) {
    try {
      const payload = SuperAdminSecurity.verifyRefreshToken(oldToken);

      const storedToken = await superAdminRepo.findRefreshToken(oldToken);

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const superAdmin = storedToken.superAdmin;

      if (!superAdmin.isActive) {
        throw new UnauthorizedException('Account is inactive');
      }

      const newAccessToken = SuperAdminSecurity.generateAccessToken({
        id: superAdmin.id,
        email: superAdmin.email,
        role: 'SUPER_ADMIN',
      });

      const newRefreshToken = SuperAdminSecurity.generateRefreshToken({
        id: superAdmin.id,
      });

      // Delete old refresh token and create new one
      await superAdminRepo.deleteRefreshToken(oldToken);
      await superAdminRepo.createRefreshToken(
        superAdmin.id,
        newRefreshToken,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      await superAdminRepo.deleteRefreshToken(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('something went wrong');
    }
  }

  async getAllOwnersWithGyms(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [owners, total] = await Promise.all([
      prisma.tenantUser.findMany({
        where: {
          role: 'OWNER',
          user: {
            isActive: true,
          },
          tenant: {
            isActive: true,
          },
        },
        skip,
        take: limit,
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
              role: true,
              createdAt: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              address: true,
              city: true,
              country: true,
              contactEmail: true,
              contactPhone: true,
              logoUrl: true,
              isActive: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.tenantUser.count({
        where: {
          role: 'OWNER',
          user: {
            isActive: true,
          },
          tenant: {
            isActive: true,
          },
        },
      }),
    ]);

    return {
      owners,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const superAdminService = new SuperAdminService();
