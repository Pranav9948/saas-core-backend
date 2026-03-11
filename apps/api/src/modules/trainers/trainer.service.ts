import { TrainerRepository } from './trainer.repository.js';
import {
  NotFoundException,
  BadRequestException,
} from '@/exceptions/exceptions.js';
import { UserRepository } from '../auth/auth.repository.js';
import { prisma } from '@/infra/db.js';
import { ErrorCode } from '@/exceptions/root.js';
import { Prisma } from '@/generated/prisma/client.js';

export class TrainerService {
  constructor(
    private userRepo = new UserRepository(),
    private trainerRepo = new TrainerRepository(),
  ) {}

  async registerTrainer(
    data: {
      userId: string;
      specialization?: string;
      bio?: string;
    },
    tenantId: string,
  ) {
    const user = await this.userRepo.findById(data.userId, tenantId);
    if (!user)
      throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND);

    const existing = await this.trainerRepo.findByUserId(data.userId, tenantId);
    if (existing) throw new BadRequestException('User is already a trainer');

    return await prisma.$transaction(async (tx) => {
      await this.userRepo.updateRole(user.id, 'TRAINER', tenantId, tx);

      const trainerData: Prisma.TrainerCreateInput = {
        specialization: data.specialization ?? null,
        bio: data.bio ?? null,
        user: {
          connect: { id: user.id },
        },
        tenant: {
          connect: { id: tenantId },
        },
      };

      return await this.trainerRepo.createProfile(trainerData, tx);
    });
  }

  async getTrainers(page: number, limit: number, tenantId: string) {
    const skip = (page - 1) * limit;
    const trainers = await this.trainerRepo.findAll(skip, limit, tenantId);
    const total = await prisma.trainer.count();
    return { trainers, meta: { total, page, limit } };
  }

  async getTrainerProfile(id: string, tenantId: string) {
    const trainer = await this.trainerRepo.findById(id, tenantId);
    if (!trainer)
      throw new NotFoundException(
        'Trainer profile not found',
        ErrorCode.NOT_FOUND,
      );
    return trainer;
  }

  async updateTrainer(id: string, data: any, tenantId: string) {
    const trainer = await this.trainerRepo.findById(id, tenantId);
    if (!trainer)
      throw new NotFoundException('Trainer not found', ErrorCode.NOT_FOUND);
    return this.trainerRepo.update(id, data, tenantId);
  }
  async deleteTrainer(id: string, tenantId: string) {
    const trainer = await this.trainerRepo.findById(id, tenantId);
    if (!trainer)
      throw new NotFoundException('Trainer not found', ErrorCode.NOT_FOUND);

    return await prisma.$transaction(async (tx) => {
      // 1. Revert user role
      await this.userRepo.updateRole(trainer.userId, 'STAFF', tenantId, tx);
      // 2. Delete trainer profile
      return this.trainerRepo.delete(id, tenantId);
    });
  }

  async getTrainerMembers(id: string, tenantId: string) {
    const trainer = await this.trainerRepo.findById(id, tenantId);
    if (!trainer)
      throw new NotFoundException('Trainer not found', ErrorCode.NOT_FOUND);
    return this.trainerRepo.findMembers(id, tenantId);
  }
}
