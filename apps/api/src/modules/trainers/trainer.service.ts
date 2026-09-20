import { TrainerRepository } from './trainer.repository.js';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@/exceptions/exceptions.js';
import { UserRepository } from '../auth/auth.repository.js';
import { prisma } from '@/infra/db.js';
import { ErrorCode } from '@/exceptions/root.js';
import { Prisma } from '@/generated/prisma/client.js';
import { TenantUserRepository } from '../tenant/tenant.userrepository.js';
import { BillingRepository } from '../billing/billing.repository.js';
import { FeatureGuardService } from '../feature-usage/feature-guard.service.js';

export class TrainerService {
  constructor(
    private userRepo = new UserRepository(),
    private trainerRepo = new TrainerRepository(),
    private tenantUserRepo = new TenantUserRepository(),
    private billingRepo = new BillingRepository(),
    private featureGuard = new FeatureGuardService(),
  ) {}

  async registerTrainer(
    data: {
      userId: string;
      specialization?: string;
      bio?: string;
    },
    tenantId: string,
  ) {
    await this.featureGuard.ensureCanCreateTrainer(tenantId);

    const user = await this.userRepo.findById(data.userId);

    if (!user) {
      throw new NotFoundException('User not found', ErrorCode.NOT_FOUND);
    }

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

    //  Check user belongs to tenant
    const tenantUser = await this.tenantUserRepo.findUserInTenant(
      data.userId,
      tenantId,
    );

    if (!tenantUser) {
      throw new BadRequestException('This user does not belong to this gym');
    }

    const existing = await this.trainerRepo.findByUserId(data.userId, tenantId);
    if (existing) {
      throw new ConflictException(
        'This user is already registered as a trainer',
        ErrorCode.RESOURCE_ALREADY_EXISTS,
      );
    }

    // 4️ Transaction

    return await prisma.$transaction(async (tx) => {
      await this.tenantUserRepo.updateRole(
        data.userId,
        tenantId,
        'TRAINER',
        tx,
      );

      await tx.user.update({
        where: { id: data.userId },
        data: { role: 'TRAINER' },
      });

      return await this.trainerRepo.createProfile(
        {
          userId: data.userId,
          tenantId,
          specialization: data.specialization ?? null,
          bio: data.bio ?? null,
        },
        tx,
      );
    });
  }

  async getTrainers(page: number, limit: number, tenantId: string) {
    const skip = (page - 1) * limit;

    const [trainers, total] = await Promise.all([
      this.trainerRepo.findAll(skip, limit, tenantId),
      this.trainerRepo.count(tenantId),
    ]);

    return {
      trainers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTrainerProfile(id: string, tenantId: string) {
    const trainer = await this.trainerRepo.findById(id, tenantId);
    if (!trainer)
      throw new NotFoundException(
        'Trainer not found',
        ErrorCode.NOT_FOUND,
      );
    return trainer;
  }

  async updateTrainer(
    id: string,
    data: {
      specialization?: string;
      bio?: string;
    },
    tenantId: string,
  ) {
    const trainer = await this.trainerRepo.findById(id, tenantId);

    if (!trainer) {
      throw new NotFoundException('Trainer not found', ErrorCode.NOT_FOUND);
    }

    return this.trainerRepo.update(id, data, tenantId);
  }

  async deleteTrainer(id: string, tenantId: string) {
    const trainer = await this.trainerRepo.findById(id, tenantId);
    if (!trainer)
      throw new NotFoundException('Trainer not found', ErrorCode.NOT_FOUND);

    return await prisma.$transaction(async (tx) => {
      // 1. Revert user role

      await this.tenantUserRepo.updateRole(
        trainer.userId,
        tenantId,
        'STAFF',
        tx,
      );

      // 2. Delete trainer profile
      return this.trainerRepo.delete(id, tenantId, tx);
    });
  }

  async getTrainerMembers(
    trainerId: string,
    tenantId: string,
    page: number,
    limit: number,
  ) {
    const trainer = await this.trainerRepo.findById(trainerId, tenantId);

    if (!trainer) {
      throw new NotFoundException('Trainer not found', ErrorCode.NOT_FOUND);
    }

    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      this.trainerRepo.findMembers(trainerId, tenantId, skip, limit),
      this.trainerRepo.countMembers(trainerId, tenantId),
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

  async enforceTrainerLimit(tenantId: string) {
    await this.featureGuard.ensureCanCreateTrainer(tenantId);
  }
}
