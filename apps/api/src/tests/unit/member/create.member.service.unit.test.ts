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
  let billingRepo: any;
  let featureGuard: any;
  let packageRepo: any;

  const tenantId = 'tenant-uuid';
  const packageId = 'package-uuid';

  const validPayload = {
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '9999999999',
    dateOfBirth: '2000-01-01',
    assignedTrainerId: 'trainer-uuid',
    packageId,
    paymentStatus: 'PAID' as const,
  };

  const membershipPackage = {
    id: packageId,
    isActive: true,
    durationDays: 30,
    name: 'Monthly',
  };

  const createdMember = {
    id: 'member-id',
    paymentStatus: 'PAID' as const,
    membershipExpiresAt: new Date('2026-10-21T00:00:00.000Z'),
  };

  beforeEach(() => {
    memberRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    trainerRepo = {
      findById: jest.fn(),
    };

    billingRepo = {
      getSubscriptionWithPlan: jest.fn().mockResolvedValue({ status: 'ACTIVE' }),
    };

    featureGuard = {
      ensureCanCreateMember: jest.fn().mockResolvedValue(undefined),
    };

    packageRepo = {
      findById: jest.fn().mockResolvedValue(membershipPackage),
    };

    service = new MemberService(
      trainerRepo,
      memberRepo,
      billingRepo,
      featureGuard,
      packageRepo,
    );
  });

  it('should throw ConflictException if email already exists', async () => {
    memberRepo.findByEmail.mockResolvedValue({ id: 'existing-id' });

    await expect(
      service.createMember(validPayload, tenantId),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(memberRepo.create).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if assigned trainer not found', async () => {
    memberRepo.findByEmail.mockResolvedValue(null);
    trainerRepo.findById.mockResolvedValue(null);

    await expect(
      service.createMember(validPayload, tenantId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(memberRepo.create).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if package is missing or inactive', async () => {
    memberRepo.findByEmail.mockResolvedValue(null);
    packageRepo.findById.mockResolvedValue(null);

    await expect(
      service.createMember(
        { ...validPayload, assignedTrainerId: undefined },
        tenantId,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(memberRepo.create).not.toHaveBeenCalled();
  });

  it('should create member successfully without trainer', async () => {
    const payload = { ...validPayload, assignedTrainerId: undefined };

    memberRepo.findByEmail.mockResolvedValue(null);
    memberRepo.create.mockResolvedValue(createdMember);

    const result = await service.createMember(payload, tenantId);

    expect(memberRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        tenantId,
        packageId,
        paymentStatus: 'PAID',
        assignedTrainerId: null,
      }),
    );
    expect(result.id).toBe('member-id');
    expect(result.remainingDays).toEqual(expect.any(Number));
  });

  it('should create member successfully with trainer', async () => {
    memberRepo.findByEmail.mockResolvedValue(null);
    trainerRepo.findById.mockResolvedValue({ id: 'trainer-uuid' });
    memberRepo.create.mockResolvedValue(createdMember);

    const result = await service.createMember(validPayload, tenantId);

    expect(trainerRepo.findById).toHaveBeenCalledWith(
      validPayload.assignedTrainerId,
      tenantId,
    );
    expect(memberRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assignedTrainerId: validPayload.assignedTrainerId,
        packageId,
        tenantId,
      }),
    );
    expect(result.id).toBe('member-id');
  });
});
