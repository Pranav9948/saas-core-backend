import { TenantService } from './../tenant/tenant.service.js';
import crypto from 'crypto';
import { UserRepository } from './auth.repository.js';
import {
  BadRequestException,
  ConflictException,
  InternalException,
  UnauthorizedException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { hashToken, Security } from '@/core/security.js';
import { TenantRepository } from '../tenant/tenant.repository.js';
import { eventBus } from '../events/event-bus.js';
import { EVENTS } from '../events/events.js';
import { logger } from '@/core/logger.js';

export class AuthService {
  private tenantService: TenantService;

  constructor(
    private userRepo: UserRepository,
    private security: typeof Security,
    private tenantRepo: TenantRepository,
  ) {
    this.tenantService = new TenantService(this.tenantRepo);
  }

  async signup(data: any, tenantId: string) {
    const existing = await this.userRepo.findByEmail(data.email, tenantId);
    if (existing) {
      throw new ConflictException(
        'User already exists',
        ErrorCode.EMAIL_ALREADY_EXISTS,
      );
    }

    const hashed = await this.security.hashPassword(data.password);

    const user = await this.userRepo.createUser(tenantId, {
      email: data.email,
      passwordHash: hashed,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return this.generateAuthResponse(user, tenantId);
  }

  async login(data: any) {
    const user = await this.userRepo.findByEmailGlobal(data.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (!user.isActive) {
      throw new UnauthorizedException('Account disabled');
    }

    const tenantUser = await this.tenantRepo.findTenantByUserId(user.id);

    if (!tenantUser) {
      throw new UnauthorizedException('User not associated with any gym');
    }

    const isValid = await this.security.comparePassword(
      data.password,
      user.passwordHash,
    );
    if (!isValid) throw new UnauthorizedException('Invalid email or password');

    await eventBus.emit(EVENTS.USER_LOGGED_IN, {
      email: user.email,
      tenantId: tenantUser.tenantId,
    });

    return this.generateAuthResponse(user, tenantUser.tenantId);
  }

  async rotateRefreshToken(oldToken: string) {
    const payload = this.security.verifyRefreshToken(oldToken);
    const { userId, tenantId } = payload;
    const hashed = hashToken(oldToken);
    const savedToken = await this.userRepo.findRefreshToken(hashed, tenantId);

    if (!savedToken) {
      logger.error({
        msg: 'Refresh token reuse detected',
        userId: payload.userId,
        tenantId,
      });

      await this.userRepo.deleteAllUserRefreshTokens(payload.userId, tenantId);
      throw new UnauthorizedException('Security alert: Session compromised.');
    }

    await this.userRepo.deleteRefreshToken(hashed, tenantId);

    const user = await this.userRepo.findById(payload.userId);
    if (!user) throw new UnauthorizedException('User not found');

    return this.generateAuthResponse(user, tenantId);
  }

  async logout(token: string, tenantId: string) {
    const hashed = hashToken(token);
    await this.userRepo.deleteRefreshToken(hashed, tenantId);
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return;

    const tenantId = await this.userRepo.getTenantIdByUserId(user.id);

    if (!tenantId) {
      throw new Error('User is not associated with any tenant.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1 * 60 * 60 * 1000);

    await this.userRepo.updateResetToken(user.id, resetToken, expiry, tenantId);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await eventBus.emit(EVENTS.PASSWORD_RESET_REQUESTED, {
      email: user.email,
      tenantId,
      resetUrl,
      firstName: user.firstName,
    });
  }

  async resetPassword(data: any, tenantId: string) {
    const user = await this.userRepo.findUserByResetToken(data.token, tenantId);
    if (!user) {
      throw new BadRequestException(
        'Invalid or expired token',
        ErrorCode.INVALID_TOKEN,
      );
    }

    const hashed = await this.security.hashPassword(data.password);
    await this.userRepo.updatePassword(user.id, hashed, tenantId);
    await this.userRepo.deleteAllUserRefreshTokens(user.id, tenantId);
  }

  async registerGym(data: any) {
    const existing = await this.userRepo.findByEmailGlobal(data.email);

    if (existing) {
      throw new ConflictException(
        'Email already registered',
        ErrorCode.EMAIL_ALREADY_EXISTS,
      );
    }

    const slug = await this.tenantService.generateUniqueSlug(data.gymName);

    const hashedPassword = await this.security.hashPassword(data.password);

    const result = await this.tenantRepo.createTenantWithOwner({
      tenant: {
        name: data.gymName,
        slug,
        contactPhone: data.contactPhone,
        contactEmail: data.email,
        address: data.address,
        city: data.city,
        country: data.country,
      },
      user: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'OWNER',
      },
    });

    const auth = await this.generateAuthResponse(result.user, result.tenant.id);

    return {
      ...auth,
      tenant: result.tenant,
    };
  }

  async getTenantIdFromRefreshToken(token: string) {
    try {
      const decoded = this.security.verifyRefreshToken(token);
      return decoded.tenantId;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateAuthResponse(user: any, tenantId: string) {
    const tenantUser = await this.tenantRepo.findTenantUser(user.id, tenantId);

    if (!tenantUser) {
      throw new UnauthorizedException('User not linked to tenant');
    }

    const accessToken = this.security.generateAccessToken({
      userId: user.id,
      tenantId,
      roleId: tenantUser.roleId!,
      role: tenantUser.role,
    });

    const refreshToken = this.security.generateRefreshToken({
      userId: user.id,
      tenantId,
    });
    const hashedToken = await hashToken(refreshToken);

    await this.userRepo.createRefreshToken(
      user.id,
      hashedToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tenantId,
    );

    return { user, accessToken, refreshToken };
  }
}

const userRepo = new UserRepository();
const tenantRepo = new TenantRepository();

export const authService = new AuthService(userRepo, Security, tenantRepo);
