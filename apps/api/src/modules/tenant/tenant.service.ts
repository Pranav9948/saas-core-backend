import slugifyPkg from 'slugify';
import { TenantRepository } from './tenant.repository.js';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { config } from '@/core/config.js';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '@/infra/s3.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { MemberRepository } from '../members/member.repository.js';
import { prisma } from '@/infra/db.js';
import { TrainerRepository } from '../trainers/trainer.repository.js';
import { TrainerService } from '../trainers/trainer.service.js';
import { logger } from '@/core/logger.js';
import { FeatureGuardService } from '../feature-usage/feature-guard.service.js';

const slugify = slugifyPkg.default;

export class TenantService {
  constructor(
    private tenantRepo: TenantRepository,
    private memberRepo = new MemberRepository(),
    private trainerRepo = new TrainerRepository(),
    private trainerService = new TrainerService(),
    private featureGuard = new FeatureGuardService(),
  ) {}

  validateRole(inviterRole: string, targetRole: string) {
    if (inviterRole === 'ADMIN' && targetRole === 'ADMIN') {
      throw new BadRequestException('ADMIN cannot create another ADMIN');
    }
  }

  async generateUniqueSlug(name: string) {
    let baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await this.tenantRepo.slugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async getCurrentTenant(tenantId: string) {
    return this.tenantRepo.findById(tenantId);
  }

  async listTeamMembers(tenantId: string) {
    const members = await this.tenantRepo.listTenantUsers(tenantId);

    return members.map((member) => ({
      id: member.id,
      userId: member.user.id,
      email: member.user.email,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      role: member.role,
      isActive: member.user.isActive,
      joinedAt: member.createdAt,
    }));
  }

  async listPendingInvites(tenantId: string) {
    return this.tenantRepo.listPendingInvites(tenantId);
  }

  async cancelInvite(tenantId: string, inviteId: string) {
    const invite = await this.tenantRepo.findInviteById(inviteId, tenantId);

    if (!invite) {
      throw new NotFoundException('Invite not found', ErrorCode.NOT_FOUND);
    }

    await this.tenantRepo.deleteInvite(invite.id);
    return { id: invite.id };
  }

  async getInvitePreview(token: string) {
    const invite = await this.tenantRepo.findInviteByToken(token);

    if (!invite) {
      throw new NotFoundException('Invite not found', ErrorCode.NOT_FOUND);
    }

    const tenant = await this.tenantRepo.findById(invite.tenantId);
    const expired = invite.expiresAt < new Date();

    return {
      email: invite.email,
      firstName: invite.firstName,
      lastName: invite.lastName,
      role: invite.role,
      gymName: tenant?.name ?? 'Your gym',
      expiresAt: invite.expiresAt,
      expired,
    };
  }

  async updateTenant(tenantId: string, data: any) {
    const existing = await this.tenantRepo.findById(tenantId);

    if (!existing) {
      throw new NotFoundException('Gym not found', ErrorCode.NOT_FOUND);
    }

    return this.tenantRepo.updateTenant(tenantId, data);
  }

  async uploadLogo(tenantId: string, fileBuffer: Buffer, mimeType: string) {
    const existingTenant = await this.tenantRepo.findById(tenantId);

    const timestamp = Date.now();

    const extension = mimeType.split('/')[1];

    const key = `tenant/${tenantId}/logo-${timestamp}.${extension}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: config.AWS_S3_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      }),
    );

    const logoUrl = `https://${config.AWS_S3_BUCKET}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;

    if (existingTenant?.logoUrl) {
      const oldKey = existingTenant.logoUrl.split('.amazonaws.com/')[1];

      await s3.send(
        new DeleteObjectCommand({
          Bucket: config.AWS_S3_BUCKET,
          Key: oldKey,
        }),
      );
    }

    await this.tenantRepo.updateLogo(tenantId, logoUrl);

    return { logoUrl };
  }

  async inviteUser(tenantId: string, inviterRole: string, data: any) {
    this.validateRole(inviterRole, data.role);

    const email = data.email.trim().toLowerCase();

    // Check duplicate in same tenant
    const exists = await this.tenantRepo.userExistsInTenant(email, tenantId);
    if (exists) {
      throw new ConflictException(
        'A team member with this email already exists in this gym',
        ErrorCode.EMAIL_ALREADY_EXISTS,
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tenantDetails = await this.tenantRepo.findById(tenantId);

    await this.tenantRepo.deletePendingInvitesForEmail(email, tenantId);

    await this.tenantRepo.createInviteToken({
      email,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      tenantId,
      role: data.role,
      token,
      expiresAt,
    });

    const inviteLink = `${config.FRONTEND_URL}/accept-invite?token=${token}`;

    await this.tenantRepo.sendInviteEmail(
      email,
      inviteLink,
      data.firstName,
      tenantDetails?.name ?? 'GymFlow',
      data.role,
      tenantId,
    );

    return { email };
  }

  async createUserDirect(tenantId: string, inviterRole: string, data: any) {
    this.validateRole(inviterRole, data.role);

    const email = data.email.trim().toLowerCase();

    const exists = await this.tenantRepo.userExistsInTenant(email, tenantId);
    if (exists) {
      throw new ConflictException(
        'A team member with this email already exists in this gym',
        ErrorCode.EMAIL_ALREADY_EXISTS,
      );
    }

    const existingGlobal = await this.tenantRepo.findUserByEmail(email);
    if (existingGlobal) {
      throw new ConflictException(
        'An account with this email already exists. Send an invite instead.',
        ErrorCode.EMAIL_ALREADY_EXISTS,
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    if (data.role === 'TRAINER') {
      await this.featureGuard.ensureCanCreateTrainer(tenantId);

      const result = await this.tenantRepo.createTrainerWithTenant({
        tenantId,
        user: {
          email,
          passwordHash: hashedPassword,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
        },
        specialization: data.specialization.trim(),
        bio: data.bio?.trim() || null,
      });

      return {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: 'TRAINER',
        isActive: result.user.isActive,
        trainerId: result.trainer.id,
        specialization: result.trainer.specialization,
      };
    }

    await this.featureGuard.ensureCanCreateStaff(tenantId);

    const user = await this.tenantRepo.createUserWithTenant({
      tenantId,
      user: {
        email,
        passwordHash: hashedPassword,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
      },
      role: data.role,
    });

    const tenantUser = await this.tenantRepo.findTenantUser(user.id, tenantId);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: tenantUser?.role ?? data.role,
      isActive: user.isActive,
    };
  }

  async acceptInvite(data: { token: string; password: string }) {
    const invite = await this.tenantRepo.findInviteByToken(data.token);

    if (!invite) {
      throw new BadRequestException('Invalid invite token');
    }

    // Expiry check
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite link expired');
    }

    // Check if user already exists
    let user = await this.tenantRepo.findUserByEmail(invite.email);

    if (!user) {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      user = await this.tenantRepo.createUser({
        email: invite.email,
        passwordHash: hashedPassword,
        firstName: invite.firstName, // optional: collect later
        lastName: invite.lastName,
      });
    }

    // Check already part of tenant
    const exists = await this.tenantRepo.userExistsInTenant(
      invite.email,
      invite.tenantId,
    );

    if (exists) {
      throw new ConflictException(
        'This user is already part of this gym',
        ErrorCode.EMAIL_ALREADY_EXISTS,
      );
    }

    if (invite.role === 'TRAINER') {
      await this.featureGuard.ensureCanCreateTrainer(invite.tenantId);
    } else if (invite.role === 'STAFF' || invite.role === 'ADMIN') {
      await this.featureGuard.ensureCanCreateStaff(invite.tenantId);
    }

    await this.tenantRepo.addUserToTenant({
      userId: user.id,
      tenantId: invite.tenantId,
      role: invite.role,
    });

    await this.tenantRepo.deleteInvite(invite.id);

    const tenantUser = await this.tenantRepo.findTenantUser(
      user.id,
      invite.tenantId,
    );

    return {
      userId: user.id,
      tenantId: invite.tenantId,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: tenantUser?.role ?? invite.role,
        isActive: user.isActive,
      },
    };
  }

  async upgradePlan(
    tenantId: string,
    planName: 'BASIC' | 'PRO',
    interval: 'MONTHLY' | 'YEARLY',
  ) {
    const targetPlan = await prisma.plan.findUnique({
      where: { name_interval: { name: planName, interval } },
    });

    if (!targetPlan) throw new Error('Plan not found');

    const memberCount = await this.memberRepo.count(tenantId);
    const trainerCount = await this.trainerRepo.count(tenantId);
    const maxMembers = (targetPlan?.features as any)?.maxMembers;
    const maxTrainers = (targetPlan?.features as any)?.maxTrainers;

    if (maxMembers !== null && memberCount >= maxMembers) {
      throw new Error(
        `You already have ${memberCount} members. Upgrade to PRO plan.`,
      );
    }

    if (maxTrainers !== null && trainerCount >= maxTrainers) {
      throw new Error(
        `You already have ${trainerCount} trainers. Upgrade to PRO plan.`,
      );
    }

    return this.tenantRepo.updatePlan(tenantId, targetPlan.id, interval);
  }
}
