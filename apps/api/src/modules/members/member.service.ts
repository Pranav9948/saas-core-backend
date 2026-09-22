import { TrainerRepository } from './../trainers/trainer.repository.js';
import {
  MemberRepository,
  type MemberListFilter,
} from './member.repository.js';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { Prisma } from '@/generated/prisma/client.js';
import { BillingRepository } from '../billing/billing.repository.js';
import { FeatureGuardService } from '../feature-usage/feature-guard.service.js';
import { MembershipPackageRepository } from '../packages/package.repository.js';
import {
  addUtcDays,
  daysRemaining,
  isExpiringOrExpired,
  resolvePaymentStatus,
  startOfUtcDay,
} from './member-membership.utils.js';
import {
  membershipRenewalTemplate,
  paymentCompletedOwnerTemplate,
  sendTransactionalEmail,
} from '@/core/mail.js';
import { prisma } from '@/infra/db.js';
import { logger } from '@/core/logger.js';

function toMemberDto<T extends {
  paymentStatus: 'PAID' | 'PENDING';
  membershipExpiresAt: Date | null;
}>(member: T) {
  const remainingDays = daysRemaining(member.membershipExpiresAt);
  return {
    ...member,
    remainingDays,
    paymentStatus: resolvePaymentStatus(
      member.paymentStatus,
      member.membershipExpiresAt,
    ),
    canSendRenewalReminder: isExpiringOrExpired(member.membershipExpiresAt),
  };
}

export class MemberService {
  constructor(
    private trainerRepo = new TrainerRepository(),
    private memberRepo = new MemberRepository(),
    private billingRepo = new BillingRepository(),
    private featureGuard = new FeatureGuardService(),
    private packageRepo = new MembershipPackageRepository(),
  ) {}

  async createMember(
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      dateOfBirth?: string;
      assignedTrainerId?: string;
      packageId: string;
      paymentStatus?: 'PAID' | 'PENDING';
    },
    tenantId: string,
  ) {
    await this.featureGuard.ensureCanCreateMember(tenantId);

    const existing = await this.memberRepo.findByEmail(data.email, tenantId);

    if (existing)
      throw new ConflictException(
        'A member with this email already exists',
        ErrorCode.EMAIL_ALREADY_EXISTS,
      );

    const subscription =
      await this.billingRepo.getSubscriptionWithPlan(tenantId);

    if (!subscription) {
      throw new NotFoundException('Subscription not found', ErrorCode.NOT_FOUND);
    }

    if (subscription.status !== 'ACTIVE') {
      throw new BadRequestException(
        'This gym does not have an active subscription',
      );
    }

    const membershipPackage = await this.packageRepo.findById(
      data.packageId,
      tenantId,
    );

    if (!membershipPackage || !membershipPackage.isActive) {
      throw new NotFoundException(
        'Selected package was not found or is inactive',
        ErrorCode.NOT_FOUND,
      );
    }

    const needsPersonalTrainer = membershipPackage.features.includes(
      'personal_training',
    );

    if (needsPersonalTrainer && !data.assignedTrainerId) {
      throw new BadRequestException(
        'This package includes personal training. Please assign a trainer.',
      );
    }

    if (data.assignedTrainerId) {
      const trainer = await this.trainerRepo.findById(
        data.assignedTrainerId,
        tenantId,
      );
      if (!trainer)
        throw new NotFoundException(
          'Assigned trainer not found',
          ErrorCode.NOT_FOUND,
        );
    }

    const startDate = startOfUtcDay();
    const expirationDate = addUtcDays(startDate, membershipPackage.durationDays);

    const member = await this.memberRepo.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone ?? null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      assignedTrainerId: data.assignedTrainerId ?? null,
      tenantId,
      packageId: membershipPackage.id,
      membershipStartDate: startDate,
      membershipExpiresAt: expirationDate,
      paymentStatus: data.paymentStatus ?? 'PAID',
    });

    return toMemberDto(member);
  }

  async listMembers(
    page: number,
    limit: number,
    tenantId: string,
    filter: MemberListFilter = {},
  ) {
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      this.memberRepo.findMany(skip, limit, tenantId, filter),
      this.memberRepo.count(tenantId, filter),
    ]);

    return {
      members: members.map(toMemberDto),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getMember(id: string, tenantId: string) {
    const member = await this.memberRepo.findById(id, tenantId);
    if (!member)
      throw new NotFoundException(
        'Member not found',
        ErrorCode.NOT_FOUND,
      );
    return toMemberDto(member);
  }

  async updateMember(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      dateOfBirth?: string;
      assignedTrainerId?: string | null;
      packageId?: string;
      paymentStatus?: 'PAID' | 'PENDING';
    },
    tenantId: string,
  ) {
    const member = await this.memberRepo.findById(id, tenantId);

    if (!member) {
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);
    }

    if (data.assignedTrainerId) {
      const trainer = await this.trainerRepo.findById(
        data.assignedTrainerId,
        tenantId,
      );

      if (!trainer) {
        throw new NotFoundException(
          'Assigned trainer not found',
          ErrorCode.NOT_FOUND,
        );
      }
    }

    let packageConnect: Prisma.MemberUpdateInput['membershipPackage'];
    let membershipStartDate: Date | undefined;
    let membershipExpiresAt: Date | undefined;
    let paymentStatus = data.paymentStatus;
    let nextPackageFeatures = member.membershipPackage?.features ?? [];
    const packageChanged = Boolean(
      data.packageId && data.packageId !== member.packageId,
    );

    if (data.packageId) {
      const membershipPackage = await this.packageRepo.findById(
        data.packageId,
        tenantId,
      );
      if (!membershipPackage || !membershipPackage.isActive) {
        throw new NotFoundException(
          'Selected package was not found or is inactive',
          ErrorCode.NOT_FOUND,
        );
      }
      nextPackageFeatures = membershipPackage.features;

      if (packageChanged) {
        packageConnect = { connect: { id: membershipPackage.id } };
        membershipStartDate = startOfUtcDay();
        membershipExpiresAt = addUtcDays(
          membershipStartDate,
          membershipPackage.durationDays,
        );
        if (!paymentStatus) {
          paymentStatus = 'PENDING';
        }
      }
    }

    const nextTrainerId =
      data.assignedTrainerId !== undefined
        ? data.assignedTrainerId
        : (member.assignedTrainer?.id ?? null);

    if (nextPackageFeatures.includes('personal_training') && !nextTrainerId) {
      throw new BadRequestException(
        'This package includes personal training. Please assign a trainer.',
      );
    }

    const updateData: Prisma.MemberUpdateInput = {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.email && { email: data.email }),
      ...(data.phone && { phone: data.phone }),
      ...(data.dateOfBirth && {
        dateOfBirth: new Date(data.dateOfBirth),
      }),
      ...(data.assignedTrainerId !== undefined && {
        assignedTrainer: data.assignedTrainerId
          ? { connect: { id: data.assignedTrainerId } }
          : { disconnect: true },
      }),
      ...(packageConnect && { membershipPackage: packageConnect }),
      ...(membershipStartDate && { membershipStartDate }),
      ...(membershipExpiresAt && { membershipExpiresAt }),
      ...(paymentStatus && { paymentStatus }),
    };

    const updated = await this.memberRepo.update(id, updateData, tenantId);
    return toMemberDto(updated);
  }

  async deleteMember(id: string, tenantId: string, userId: string) {
    const member = await this.memberRepo.findById(id, tenantId);

    if (!member) {
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);
    }

    if (member.status === 'DELETED') {
      throw new BadRequestException('Member already deleted');
    }

    return this.memberRepo.softDelete(id, tenantId, userId);
  }

  async getMemberHistory(id: string, tenantId: string) {
    const member = await this.memberRepo.findById(id, tenantId);
    if (!member)
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);

    return this.memberRepo.getAttendanceHistory(id, tenantId);
  }

  async sendRenewalReminder(id: string, tenantId: string) {
    const member = await this.memberRepo.findById(id, tenantId);
    if (!member) {
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);
    }

    if (!isExpiringOrExpired(member.membershipExpiresAt)) {
      throw new BadRequestException(
        'Renewal reminders can only be sent for members expiring within 7 days or already expired',
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    const remaining = daysRemaining(member.membershipExpiresAt) ?? 0;
    const expirationDate = member.membershipExpiresAt
      ? member.membershipExpiresAt.toISOString().slice(0, 10)
      : 'unknown';
    const packageName = member.membershipPackage?.name ?? 'membership';
    const html = membershipRenewalTemplate({
      memberName: member.firstName,
      gymName: tenant?.name ?? 'your gym',
      packageName,
      expirationDate,
      remainingDays: remaining,
    });

    await sendTransactionalEmail({
      to: member.email,
      subject: `Renew your ${packageName} membership`,
      html,
    });

    return { sent: true, to: member.email };
  }

  async markPaymentPaid(
    id: string,
    tenantId: string,
    recordedBy: { userId: string },
  ) {
    const member = await this.memberRepo.findById(id, tenantId);
    if (!member) {
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);
    }

    const remaining = daysRemaining(member.membershipExpiresAt);
    const alreadyPaidThisCycle =
      member.paymentStatus === 'PAID' && (remaining === null || remaining >= 0);

    if (alreadyPaidThisCycle) {
      throw new BadRequestException(
        'This member is already marked as paid for the current cycle',
      );
    }

    let membershipStartDate: Date | undefined;
    let membershipExpiresAt: Date | undefined;

    if (remaining !== null && remaining < 0 && member.membershipPackage) {
      membershipStartDate = startOfUtcDay();
      membershipExpiresAt = addUtcDays(
        membershipStartDate,
        member.membershipPackage.durationDays,
      );
    }

    const updated = await this.memberRepo.update(
      id,
      {
        paymentStatus: 'PAID',
        ...(membershipStartDate && { membershipStartDate }),
        ...(membershipExpiresAt && { membershipExpiresAt }),
      },
      tenantId,
    );

    const dto = toMemberDto(updated);
    const staff = await prisma.user.findUnique({
      where: { id: recordedBy.userId },
      select: { firstName: true, lastName: true },
    });
    await this.notifyOwnerPaymentCompleted({
      tenantId,
      memberName: `${member.firstName} ${member.lastName}`,
      memberEmail: member.email,
      packageName: member.membershipPackage?.name ?? 'membership',
      amount: member.membershipPackage?.price ?? 0,
      currency: member.membershipPackage?.currency ?? 'INR',
      recordedByName: staff
        ? `${staff.firstName} ${staff.lastName}`.trim()
        : 'Staff',
      renewed: Boolean(membershipStartDate),
    });

    return dto;
  }

  private async notifyOwnerPaymentCompleted(payload: {
    tenantId: string;
    memberName: string;
    memberEmail: string;
    packageName: string;
    amount: number;
    currency: string;
    recordedByName: string;
    renewed: boolean;
  }) {
    const [tenant, owner] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: payload.tenantId },
        select: { name: true, contactEmail: true },
      }),
      prisma.tenantUser.findFirst({
        where: { tenantId: payload.tenantId, role: 'OWNER' },
        select: {
          user: { select: { email: true, firstName: true } },
        },
      }),
    ]);

    const ownerEmail = owner?.user.email || tenant?.contactEmail;
    if (!ownerEmail) {
      return;
    }

    try {
      await sendTransactionalEmail({
        to: ownerEmail,
        subject: `Payment received: ${payload.memberName}`,
        html: paymentCompletedOwnerTemplate({
          ownerName: owner?.user.firstName ?? 'there',
          gymName: tenant?.name ?? 'your gym',
          memberName: payload.memberName,
          memberEmail: payload.memberEmail,
          packageName: payload.packageName,
          amount: payload.amount,
          currency: payload.currency,
          recordedByName: payload.recordedByName,
          renewed: payload.renewed,
        }),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to notify owner of member payment');
    }
  }

  async enforceMemberLimit(tenantId: string) {
    await this.featureGuard.ensureCanCreateMember(tenantId);
  }

  async enforceFeature(tenantId: string, feature: string) {
    const features = await this.billingRepo.getPlanFeaturesByTenant(tenantId);

    if (!features[feature]) {
      throw new BadRequestException(
        `Feature "${feature}" not available in your plan.`,
      );
    }
  }
}
