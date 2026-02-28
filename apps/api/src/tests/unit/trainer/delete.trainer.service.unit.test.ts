import { TrainerService } from '@/modules/trainers/trainer.service.js';
import { NotFoundException } from '@/exceptions/exceptions.js';
import { jest } from '@jest/globals';
import { UserRepository } from '@/modules/auth/auth.repository.js';
import { TrainerRepository } from '@/modules/trainers/trainer.repository.js';
import { prisma } from '@/infra/db.js';

describe('TrainerService - deleteTrainer', () => {
  let service: TrainerService;
  let userRepo: jest.Mocked<UserRepository>;
  let trainerRepo: jest.Mocked<TrainerRepository>;
  let prismaMock: any;

  beforeEach(() => {
    trainerRepo = {
      findById: jest.fn(),
      delete: jest.fn(),
    } as any;

    userRepo = {
      updateRole: jest.fn(),
    } as any;

    service = new TrainerService(userRepo, trainerRepo);
  });

  it('should throw NotFoundException if trainer not found', async () => {
    trainerRepo.findById.mockResolvedValue(null);

    await expect(service.deleteTrainer('uuid-id')).rejects.toThrow(
      NotFoundException,
    );

    expect(trainerRepo.findById).toHaveBeenCalledWith('uuid-id');
  });

  it('should revert role and delete trainer inside transaction', async () => {
    const trainer = {
      id: '1',
      userId: '10',
      specialization: null,
      bio: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
      },
    };

    (prisma as any).$transaction = jest.fn(async (callback: any) =>
      callback({}),
    );

    trainerRepo.findById.mockResolvedValue(trainer);
    trainerRepo.delete.mockResolvedValue(trainer);

    const result = await service.deleteTrainer('uuid-id');

    expect(userRepo.updateRole).toHaveBeenCalledWith(
      '10',
      'STAFF',
      expect.anything(),
    );

    expect(trainerRepo.delete).toHaveBeenCalledWith('uuid-id');

    expect(result).toEqual(trainer);
  });
});
