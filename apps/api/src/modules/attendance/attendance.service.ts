import { AttendanceRepository } from './attendance.repository.js';
import { MemberRepository } from '../members/member.repository.js';
import {
  BadRequestException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { ErrorCode } from '@/exceptions/root.js';

const attendanceRepo = new AttendanceRepository();
const memberRepo = new MemberRepository();

export class AttendanceService {
  async markAttendance(memberId: string, deviceInfo?: string) {
    // 1. Check if member exists and is active
    const member = await memberRepo.findById(memberId);
    if (!member)
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);
    if (member.status !== 'ACTIVE')
      throw new BadRequestException('Inactive members cannot check in');

    // 2. Prevent duplicate check-in for the same day
    const now = new Date();
    const existing = await attendanceRepo.findExistingCheckIn(
      memberId,
      startOfDay(now),
      endOfDay(now),
    );

    if (existing) {
      throw new BadRequestException('Member has already checked in today');
    }

    return attendanceRepo.create({ memberId, deviceInfo });
  }

  async getDailyAttendance(dateString?: string) {
    const targetDate = dateString ? parseISO(dateString) : new Date();
    return attendanceRepo.findByDateRange(
      startOfDay(targetDate),
      endOfDay(targetDate),
    );
  }

  async getMemberStats(memberId: string) {
    const member = await memberRepo.findById(memberId);
    if (!member)
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);

    return attendanceRepo.getStats(memberId);
  }
}
