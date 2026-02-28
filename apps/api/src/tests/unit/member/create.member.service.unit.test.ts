import { MemberService } from '@/modules/members/member.service.js';
import {
  ConflictException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { jest } from '@jest/globals';

describe('MemberService - createMember', () => {
  let service: MemberService;
  let memberRepo: any;
  let trainerRepo: any;

  const validPayload = {
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '9999999999',
    dateOfBirth: '2000-01-01',
    assignedTrainerId: 'trainer-uuid',
  };

  beforeEach(() => {
    memberRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    trainerRepo = {
      findById: jest.fn(),
    };

    service = new MemberService(trainerRepo, memberRepo);
  });

  it('should throw ConflictException if email already exists', async () => {
    memberRepo.findByEmail.mockResolvedValue({ id: 'existing-id' });

    await expect(service.createMember(validPayload)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(memberRepo.create).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if assigned trainer not found', async () => {
    memberRepo.findByEmail.mockResolvedValue(null);
    trainerRepo.findById.mockResolvedValue(null);

    await expect(service.createMember(validPayload)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(memberRepo.create).not.toHaveBeenCalled();
  });

  it('should create member successfully without trainer', async () => {
    const payload = { ...validPayload, assignedTrainerId: undefined };

    memberRepo.findByEmail.mockResolvedValue(null);
    memberRepo.create.mockResolvedValue({ id: 'member-id' });

    const result = await service.createMember(payload);

    expect(memberRepo.create).toHaveBeenCalledWith(payload);
    expect(result.id).toBe('member-id');
  });

  it('should create member successfully with trainer', async () => {
    memberRepo.findByEmail.mockResolvedValue(null);
    trainerRepo.findById.mockResolvedValue({ id: 'trainer-uuid' });
    memberRepo.create.mockResolvedValue({ id: 'member-id' });

    const result = await service.createMember(validPayload);

    expect(trainerRepo.findById).toHaveBeenCalledWith(
      validPayload.assignedTrainerId,
    );
    expect(memberRepo.create).toHaveBeenCalledWith(validPayload);
    expect(result.id).toBe('member-id');
  });
});
