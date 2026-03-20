import { AttendanceRepository } from './attendance.repository.js';
import { MemberRepository } from '../members/member.repository.js';
import {
  BadRequestException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { ErrorCode } from '@/exceptions/root.js';
import { logger } from '@/core/logger.js';

export class AttendanceService {
  constructor(
    private attendanceRepo = new AttendanceRepository(),
    private memberRepo = new MemberRepository(),
  ) {}

  async markAttendance(
    memberId: string,
    tenantId: string,
    deviceInfo?: string,
  ) {
    const member = await this.memberRepo.findById(memberId, tenantId);

    if (!member) {
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);
    }

    if (member.status !== 'ACTIVE') {
      throw new BadRequestException('Inactive members cannot check in');
    }

    const today = new Date();
    const dateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    try {
      return await this.attendanceRepo.create({
        memberId,
        tenantId,
        deviceInfo,
        date: dateOnly,
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Member already checked in today');
      }
      throw error;
    }
  }

  async getDailyAttendance(tenantId: string, dateString?: string) {
    const targetDate = dateString ? parseISO(dateString) : new Date();
    return this.attendanceRepo.findByDateRange(
      startOfDay(targetDate),
      endOfDay(targetDate),
      tenantId,
    );
  }

  async getMemberStats(memberId: string, tenantId: string) {
    const member = await this.memberRepo.findById(memberId, tenantId);
    if (!member)
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);

    return this.attendanceRepo.getStats(memberId, tenantId);
  }
}
