import { TrainerRepository } from './trainer.repository.js';
import {
  NotFoundException,
  BadRequestException,
} from '@/exceptions/exceptions.js';
import { UserRepository } from '../auth/auth.repository.js';
import { prisma } from '@/infra/db.js';
import { ErrorCode } from '@/exceptions/root.js';
import { Prisma } from '@/generated/prisma/client.js';

const trainerRepo = new TrainerRepository();
const userRepo = new UserRepository();

export class TrainerService {
  async registerTrainer(data: {
    userId: string;
    specialization?: string;
    bio?: string;
  }) {
    const user = await userRepo.findById(data.userId);
    if (!user)
      throw new NotFoundException('User not found', ErrorCode.USER_NOT_FOUND);

    const existing = await trainerRepo.findByUserId(data.userId);
    if (existing) throw new BadRequestException('User is already a trainer');

    return await prisma.$transaction(async (tx) => {
      await userRepo.updateRole(user.id, 'TRAINER', tx);

      // Define the input clearly to satisfy the CreateInput type
      const trainerData: Prisma.TrainerCreateInput = {
        specialization: data.specialization ?? null,
        bio: data.bio ?? null,
        user: {
          connect: { id: user.id },
        },
      };

      return await trainerRepo.createProfile(trainerData, tx);
    });
  }

  async getTrainers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const trainers = await trainerRepo.findAll(skip, limit);
    const total = await prisma.trainer.count();
    return { trainers, meta: { total, page, limit } };
  }

  async getTrainerProfile(id: string) {
    const trainer = await trainerRepo.findById(id);
    if (!trainer)
      throw new NotFoundException(
        'Trainer profile not found',
        ErrorCode.NOT_FOUND,
      );
    return trainer;
  }

  async updateTrainer(id: string, data: any) {
    const trainer = await trainerRepo.findById(id);
    if (!trainer)
      throw new NotFoundException('Trainer not found', ErrorCode.NOT_FOUND);
    return trainerRepo.update(id, data);
  }
  async deleteTrainer(id: string) {
    const trainer = await trainerRepo.findById(id);
    if (!trainer)
      throw new NotFoundException('Trainer not found', ErrorCode.NOT_FOUND);

    return await prisma.$transaction(async (tx) => {
      // 1. Revert user role
      await userRepo.updateRole(trainer.userId, 'STAFF', tx);
      // 2. Delete trainer profile
      return trainerRepo.delete(id);
    });
  }

  async getTrainerMembers(id: string) {
    const trainer = await trainerRepo.findById(id);
    if (!trainer)
      throw new NotFoundException('Trainer not found', ErrorCode.NOT_FOUND);
    return trainerRepo.findMembers(id);
  }
}
