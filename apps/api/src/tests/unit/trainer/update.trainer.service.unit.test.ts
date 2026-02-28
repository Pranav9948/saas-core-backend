import { NotFoundException } from '@/exceptions/exceptions.js';
import { TrainerService } from '@/modules/trainers/trainer.service.js';
import { jest } from '@jest/globals';

describe('TrainerService - updateTrainer', () => {
  let service: TrainerService;
  let trainerRepo: any;

  beforeEach(() => {
    trainerRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    service = new TrainerService(undefined, trainerRepo);
  });

  it('should throw NotFoundException if trainer does not exist', async () => {
    trainerRepo.findById.mockResolvedValue(null);

    await expect(
      service.updateTrainer('trainer-id', { bio: 'Updated bio' }),
    ).rejects.toThrow(NotFoundException);

    expect(trainerRepo.findById).toHaveBeenCalledWith('trainer-id');
  });

  it('should update trainer successfully', async () => {
    const trainer = { id: 'trainer-id' };
    const updatedTrainer = { id: 'trainer-id', bio: 'Updated bio' };

    trainerRepo.findById.mockResolvedValue(trainer);
    trainerRepo.update.mockResolvedValue(updatedTrainer);

    const result = await service.updateTrainer('trainer-id', {
      bio: 'Updated bio',
    });

    expect(trainerRepo.findById).toHaveBeenCalledWith('trainer-id');
    expect(trainerRepo.update).toHaveBeenCalledWith('trainer-id', {
      bio: 'Updated bio',
    });
    expect(result).toEqual(updatedTrainer);
  });
});
