import { TrainerRepository } from './../trainers/trainer.repository.js';
import { MemberRepository } from './member.repository.js';
import {
  ConflictException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { prisma } from '@/infra/db.js';

export class MemberService {
  constructor(
    private trainerRepo = new TrainerRepository(),
    private memberRepo = new MemberRepository(),
  ) {}

  async createMember(data: any) {
    const existing = await this.memberRepo.findByEmail(data.email);

    if (existing)
      throw new ConflictException(
        'Member email already exists',
        ErrorCode.EMAIL_ALREADY_EXISTS,
      );

    if (data.assignedTrainerId) {
      const trainer = await this.trainerRepo.findById(data.assignedTrainerId);
      if (!trainer)
        throw new NotFoundException(
          'Assigned trainer not found',
          ErrorCode.NOT_FOUND,
        );
    }

    return this.memberRepo.create(data);
  }

  async listMembers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [members, total] = await Promise.all([
      this.memberRepo.findMany(skip, limit),
      prisma.member.count({ where: { status: { not: 'DELETED' } } }),
    ]);

    return {
      members,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMember(id: string) {
    const member = await this.memberRepo.findById(id);
    if (!member)
      throw new NotFoundException(
        'member profile not found',
        ErrorCode.NOT_FOUND,
      );
    return member;
  }

  async updateMember(id: string, data: any) {
    const member = await this.memberRepo.findById(id);
    if (!member)
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);

    if (data.assignedTrainerId) {
      const trainer = await this.trainerRepo.findById(data.assignedTrainerId);
      if (!trainer)
        throw new NotFoundException(
          'The specified trainer does not exist',
          ErrorCode.NOT_FOUND,
        );
    }

    const updateData = {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    };

    return this.memberRepo.update(id, updateData);
  }

  async deleteMember(id: string) {
    const member = await this.memberRepo.findById(id);
    if (!member)
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);

    return this.memberRepo.softDelete(id);
  }

  async getMemberHistory(id: string) {
    const member = await this.memberRepo.findById(id);
    if (!member)
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);

    return this.memberRepo.getAttendanceHistory(id);
  }
}
