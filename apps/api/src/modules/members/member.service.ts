import { TrainerRepository } from './../trainers/trainer.repository.js';
import { MemberRepository } from './member.repository.js';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { Prisma } from '@/generated/prisma/client.js';
import { prisma } from '@/infra/db.js';
import { BillingRepository } from '../billing/billing.repository.js';

export class MemberService {
  constructor(
    private trainerRepo = new TrainerRepository(),
    private memberRepo = new MemberRepository(),
    private billingRepo = new BillingRepository(),
  ) {}

  async createMember(
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      dateOfBirth?: string;
      assignedTrainerId?: string;
    },
    tenantId: string,
  ) {

    await this.enforceMemberLimit(tenantId)

    const existing = await this.memberRepo.findByEmail(data.email, tenantId);

    if (existing)
      throw new ConflictException(
        'Member email already exists',
        ErrorCode.EMAIL_ALREADY_EXISTS,
      );

    const subscription =
      await this.billingRepo.getSubscriptionWithPlan(tenantId);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new Error('Subscription inactive');
    }

    const memberCount = await this.memberRepo.count(tenantId);
    const maxMembers = (subscription?.plan?.features as any)?.maxMembers;

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

    const createData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone ?? null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      assignedTrainerId: data.assignedTrainerId ?? null,
      tenantId,
    };

    return this.memberRepo.create(createData);
  }

  async listMembers(page: number, limit: number, tenantId: string) {
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      this.memberRepo.findMany(skip, limit, tenantId),
      this.memberRepo.count(tenantId),
    ]);

    return {
      members,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMember(id: string, tenantId: string) {
    const member = await this.memberRepo.findById(id, tenantId);
    if (!member)
      throw new NotFoundException(
        'member profile not found',
        ErrorCode.NOT_FOUND,
      );
    return member;
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
          : { disconnect: true }, // allow unassign trainer
      }),
    };

    return this.memberRepo.update(id, updateData, tenantId);
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

  async enforceMemberLimit(tenantId: string) {
    const features = await this.billingRepo.getPlanFeaturesByTenant(tenantId);

    if (!features.maxMembers) return; 

    const count = await prisma.member.count({
      where: { tenantId },
    });

    if (count >= features.maxMembers) {
      throw new BadRequestException(
        `Member limit reached (${features.maxMembers}). Upgrade your plan.`,
      );
    }
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
