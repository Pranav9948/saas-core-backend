import { NotFoundException } from '@/exceptions/exceptions.js';
import { MemberRepository } from '@/modules/members/member.repository.js';
import { MemberService } from '@/modules/members/member.service.js';
import { TrainerRepository } from '@/modules/trainers/trainer.repository.js';
import { jest } from '@jest/globals';

describe('MemberService - updateMember', () => {
  let service: MemberService;

  let mockMemberRepo: jest.Mocked<MemberRepository>;
  let mockTrainerRepo: jest.Mocked<TrainerRepository>;
  let mockPackageRepo: {
    findById: jest.Mock;
  };

  const tenantId = 'tenant-uuid';
  const memberId = '550e8400-e29b-41d4-a716-446655440000';
  const existingMember = {
    id: memberId,
    paymentStatus: 'PAID' as const,
    membershipExpiresAt: null,
  };

  beforeEach(() => {
    mockMemberRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<MemberRepository>;

    mockTrainerRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<TrainerRepository>;

    mockPackageRepo = {
      findById: jest.fn(),
    };

    service = new MemberService(
      mockTrainerRepo,
      mockMemberRepo,
      { getSubscriptionWithPlan: jest.fn() } as never,
      { ensureCanCreateMember: jest.fn() } as never,
      mockPackageRepo as never,
    );
  });

  it('should throw NotFoundException if member does not exist', async () => {
    mockMemberRepo.findById.mockResolvedValue(null);

    await expect(
      service.updateMember(memberId, { firstName: 'Updated' }, tenantId),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if assigned trainer does not exist', async () => {
    mockMemberRepo.findById.mockResolvedValue(existingMember as never);
    mockTrainerRepo.findById.mockResolvedValue(null);

    await expect(
      service.updateMember(
        memberId,
        { assignedTrainerId: 'trainer-uuid' },
        tenantId,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should update successfully', async () => {
    const updatedMember = {
      ...existingMember,
      firstName: 'Updated',
    };

    mockMemberRepo.findById.mockResolvedValue(existingMember as never);
    mockMemberRepo.update.mockResolvedValue(updatedMember as never);

    const result = await service.updateMember(
      memberId,
      { firstName: 'Updated' },
      tenantId,
    );

    expect(result.id).toBe(memberId);
    expect(result.firstName).toBe('Updated');
    expect(result.paymentStatus).toBe('PAID');
  });
});
