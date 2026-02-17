import { MemberRepository } from './member.repository.js';
import { TrainerRepository } from '../trainers/trainer.repository.js';
import {
  ConflictException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { prisma } from '@/infra/db.js';
import { logger } from '@/core/logger.js';

const memberRepo = new MemberRepository();
const trainerRepo = new TrainerRepository();

export class MemberService {
  async createMember(data: any) {
    const existing = await prisma.member.findUnique({
      where: { email: data.email },
    });
    if (existing)
      throw new ConflictException(
        'Member email already exists',
        ErrorCode.EMAIL_ALREADY_EXISTS,
      );

    if (data.assignedTrainerId) {
      const trainer = await trainerRepo.findById(data.assignedTrainerId);
      if (!trainer)
        throw new NotFoundException(
          'Assigned trainer not found',
          ErrorCode.NOT_FOUND,
        );
    }

    return memberRepo.create(data);
  }

  async listMembers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [members, total] = await Promise.all([
      memberRepo.findMany(skip, limit),
      prisma.member.count({ where: { status: { not: 'DELETED' } } }),
    ]);

    return {
      members,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMember(id: string) {
    const member = await memberRepo.findById(id);
    if (!member)
      throw new NotFoundException(
        'member profile not found',
        ErrorCode.NOT_FOUND,
      );
    return member;
  }

  async updateMember(id: string, data: any) {
    const member = await memberRepo.findById(id);
    if (!member)
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);

    if (data.assignedTrainerId) {
      const trainer = await trainerRepo.findById(data.assignedTrainerId);
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

    return memberRepo.update(id, updateData);
  }

  async deleteMember(id: string) {
    const member = await memberRepo.findById(id);
    if (!member)
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);

    return memberRepo.softDelete(id);
  }

  async getMemberHistory(id: string) {
    const member = await memberRepo.findById(id);
    if (!member)
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);

    return memberRepo.getAttendanceHistory(id);
  }
}
