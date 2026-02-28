import { NotFoundException } from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { MemberService } from '@/modules/members/member.service.js';
import { jest } from '@jest/globals';

describe('MemberService - deleteMember', () => {
  let memberService: MemberService;
  let memberRepo: any;
  let trainerRepo: any;

  beforeEach(() => {
    memberRepo = {
      findById: jest.fn(),
      softDelete: jest.fn(),
    };

    memberService = new MemberService(trainerRepo, memberRepo);
  });

  it('should soft delete member when member exists', async () => {
    const memberId = 'uuid-123';

    memberRepo.findById.mockResolvedValue({ id: memberId });
    memberRepo.softDelete.mockResolvedValue({
      id: memberId,
      status: 'DELETED',
    });

    const result = await memberService.deleteMember(memberId);

    expect(memberRepo.findById).toHaveBeenCalledWith(memberId);
    expect(memberRepo.softDelete).toHaveBeenCalledWith(memberId);
    expect(result.status).toBe('DELETED');
  });

  it('should throw NotFoundException if member does not exist', async () => {
    memberRepo.findById.mockResolvedValue(null);

    await expect(memberService.deleteMember('invalid-id')).rejects.toThrow(
      new NotFoundException('Member not found', ErrorCode.NOT_FOUND),
    );

    expect(memberRepo.softDelete).not.toHaveBeenCalled();
  });
});
