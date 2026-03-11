import { AttendanceRepository } from './attendance.repository.js';
import { MemberRepository } from '../members/member.repository.js';
import {
  BadRequestException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { ErrorCode } from '@/exceptions/root.js';

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
    // 1. Check if member exists and is active
    const member = await this.memberRepo.findById(memberId, tenantId);
    if (!member)
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);
    if (member.status !== 'ACTIVE')
      throw new BadRequestException('Inactive members cannot check in');

    // 2. Prevent duplicate check-in for the same day
    const now = new Date();
    const existing = await this.attendanceRepo.findExistingCheckIn(
      memberId,
      startOfDay(now),
      endOfDay(now),
      tenantId,
    );

    if (existing) {
      throw new BadRequestException('Member has already checked in today');
    }

    return this.attendanceRepo.create({ memberId, deviceInfo, tenantId });
  }

  async getDailyAttendance(tenantId: string, dateString?: string) {
    const targetDate = dateString ? parseISO(dateString) : new Date();
    return this.attendanceRepo.findByDateRange(
      startOfDay(targetDate),
      endOfDay(targetDate),
      tenantId,
    );
  }

  async getMemberStats(tenantId: string, memberId: string) {
    const member = await this.memberRepo.findById(memberId, tenantId);
    if (!member)
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);

    return this.attendanceRepo.getStats(memberId, tenantId);
  }
}
