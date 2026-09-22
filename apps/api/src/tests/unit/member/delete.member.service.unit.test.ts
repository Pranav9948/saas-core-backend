import { NotFoundException } from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { MemberService } from '@/modules/members/member.service.js';
import { jest } from '@jest/globals';

describe('MemberService - deleteMember', () => {
  let memberService: MemberService;
  let memberRepo: any;
  let trainerRepo: any;

  const tenantId = 'tenant-uuid';
  const userId = 'user-uuid';

  beforeEach(() => {
    memberRepo = {
      findById: jest.fn(),
      softDelete: jest.fn(),
    };

    trainerRepo = {
      findById: jest.fn(),
    };

    memberService = new MemberService(
      trainerRepo,
      memberRepo,
      { getSubscriptionWithPlan: jest.fn() } as never,
      { ensureCanCreateMember: jest.fn() } as never,
      { findById: jest.fn() } as never,
    );
  });

  it('should soft delete member when member exists', async () => {
    const memberId = 'uuid-123';

    memberRepo.findById.mockResolvedValue({
      id: memberId,
      status: 'ACTIVE',
      paymentStatus: 'PAID',
      membershipExpiresAt: null,
    });
    memberRepo.softDelete.mockResolvedValue({
      id: memberId,
      status: 'DELETED',
    });

    const result = await memberService.deleteMember(memberId, tenantId, userId);

    expect(memberRepo.findById).toHaveBeenCalledWith(memberId, tenantId);
    expect(memberRepo.softDelete).toHaveBeenCalledWith(memberId, tenantId, userId);
    expect(result.status).toBe('DELETED');
  });

  it('should throw NotFoundException if member does not exist', async () => {
    memberRepo.findById.mockResolvedValue(null);

    await expect(
      memberService.deleteMember('invalid-id', tenantId, userId),
    ).rejects.toThrow(
      new NotFoundException('Member not found', ErrorCode.NOT_FOUND),
    );

    expect(memberRepo.softDelete).not.toHaveBeenCalled();
  });
});
