import slugifyPkg from 'slugify';
import { TenantRepository } from './tenant.repository.js';
import {
  BadRequestException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { config } from '@/core/config.js';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '@/infra/s3.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const slugify = slugifyPkg.default;

export class TenantService {
  constructor(private tenantRepo: TenantRepository) {}

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

    // Check duplicate in same tenant
    const exists = await this.tenantRepo.userExistsInTenant(
      data.email,
      tenantId,
    );
    if (exists) {
      throw new BadRequestException('User already exists in this tenant');
    }

    // Generate token

    const token = crypto.randomBytes(32).toString('hex');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const tenantDetails = await this.tenantRepo.findById(tenantId);

    await this.tenantRepo.createInviteToken({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      tenantId,
      role: data.role,
      token,
      expiresAt,
    });

    const inviteLink = `http://localhost:3000/accept-invite?token=${token}`;

    // Send Email
    await this.tenantRepo.sendInviteEmail(
      data.email,
      inviteLink,
      data.firstname,
      tenantDetails?.name ?? 'gym sass team',
      data.role,
    );

    return { email: data.email };
  }

  async createUserDirect(tenantId: string, inviterRole: string, data: any) {
    this.validateRole(inviterRole, data.role);

    const exists = await this.tenantRepo.userExistsInTenant(
      data.email,
      tenantId,
    );
    if (exists) {
      throw new BadRequestException('User already exists in this tenant');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.tenantRepo.createUserWithTenant({
      tenantId,
      user: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      role: data.role,
    });
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
      throw new BadRequestException('User already part of this tenant');
    }

    // Attach to tenant
    await this.tenantRepo.addUserToTenant({
      userId: user.id,
      tenantId: invite.tenantId,
      role: invite.role,
    });

    // Delete invite (one-time use)
    await this.tenantRepo.deleteInvite(invite.id);

    return { userId: user.id };
  }
}
