import { NotFoundException } from '@/exceptions/exceptions.js';
import { MemberRepository } from '@/modules/members/member.repository.js';
import { MemberService } from '@/modules/members/member.service.js';
import { TrainerRepository } from '@/modules/trainers/trainer.repository.js';
import { jest } from '@jest/globals';

describe('MemberService - updateMember', () => {
  let service: MemberService;

  let mockMemberRepo: jest.Mocked<MemberRepository>;
  let mockTrainerRepo: jest.Mocked<TrainerRepository>;

  beforeEach(() => {
    mockMemberRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    mockTrainerRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<TrainerRepository>;

    service = new MemberService(mockTrainerRepo, mockMemberRepo);
  });

  const memberId = '550e8400-e29b-41d4-a716-446655440000';

  it('should throw NotFoundException if member does not exist', async () => {
    mockMemberRepo.findById.mockResolvedValue(null);

    await expect(
      service.updateMember(memberId, { firstName: 'Updated' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if assigned trainer does not exist', async () => {
    mockMemberRepo.findById.mockResolvedValue({ id: memberId } as any);
    mockTrainerRepo.findById.mockResolvedValue(null);

    await expect(
      service.updateMember(memberId, {
        assignedTrainerId: 'trainer-uuid',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should update successfully', async () => {
    const existingMember = { id: memberId } as any;
    const updatedMember = { id: memberId, firstName: 'Updated' } as any;

    mockMemberRepo.findById.mockResolvedValue(existingMember);
    mockMemberRepo.update.mockResolvedValue(updatedMember);

    const result = await service.updateMember(memberId, {
      firstName: 'Updated',
    });

    expect(result).toEqual(updatedMember);
  });
});
