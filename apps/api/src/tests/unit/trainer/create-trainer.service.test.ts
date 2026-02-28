import { TrainerService } from '@/modules/trainers/trainer.service.js';
import { UserRepository } from '@/modules/auth/auth.repository.js';
import { TrainerRepository } from '@/modules/trainers/trainer.repository.js';

import { jest } from '@jest/globals';

jest.mock('@/infra/db.js', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@/infra/db.js';

describe('TrainerService - registerTrainer', () => {
  let service: TrainerService;
  let userRepo: jest.Mocked<UserRepository>;
  let trainerRepo: jest.Mocked<TrainerRepository>;

  const userId = 'uuid-user';

  beforeEach(() => {
    userRepo = {
      findById: jest.fn(),
      updateRole: jest.fn(),
    } as any;

    trainerRepo = {
      findByUserId: jest.fn(),
      createProfile: jest.fn(),
    } as any;

    service = new TrainerService(userRepo, trainerRepo);
  });

  it('should throw if user not found', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(service.registerTrainer({ userId })).rejects.toThrow();
  });

  it('should throw if already trainer', async () => {
    userRepo.findById.mockResolvedValue({ id: userId } as any);
    trainerRepo.findByUserId.mockResolvedValue({ id: 'trainer-1' } as any);

    await expect(service.registerTrainer({ userId })).rejects.toThrow();
  });

  it('should update role and create profile inside transaction', async () => {
    userRepo.findById.mockResolvedValue({ id: userId } as any);
    trainerRepo.findByUserId.mockResolvedValue(null);

    (prisma as any).$transaction = jest.fn(async (callback: any) =>
      callback({}),
    );

    userRepo.updateRole.mockResolvedValue({} as any);
    trainerRepo.createProfile.mockResolvedValue({ id: 'trainer-1' } as any);

    const result = await service.registerTrainer({
      userId,
      specialization: 'Yoga',
    });

    expect(userRepo.updateRole).toHaveBeenCalled();
    expect(trainerRepo.createProfile).toHaveBeenCalled();
    expect(result).toEqual({ id: 'trainer-1' });
  });
});
