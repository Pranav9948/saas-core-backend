import {
  BadRequestException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { AttendanceService } from '@/modules/attendance/attendance.service.js';
import { jest } from '@jest/globals';

describe('AttendanceService - markAttendance', () => {
  let service: AttendanceService;
  let attendanceRepo: any;
  let memberRepo: any;

  beforeEach(() => {
    attendanceRepo = {
      findExistingCheckIn: jest.fn(),
      create: jest.fn(),
    };

    memberRepo = {
      findById: jest.fn(),
    };

    service = new AttendanceService(attendanceRepo, memberRepo);
  });

  it('should throw NotFoundException if member does not exist', async () => {
    memberRepo.findById.mockResolvedValue(null);

    await expect(service.markAttendance('member-id')).rejects.toThrow(
      NotFoundException,
    );

    expect(memberRepo.findById).toHaveBeenCalledWith('member-id');
  });

  it('should throw BadRequestException if member is not ACTIVE', async () => {
    memberRepo.findById.mockResolvedValue({ id: '1', status: 'INACTIVE' });

    await expect(service.markAttendance('1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException if already checked in today', async () => {
    memberRepo.findById.mockResolvedValue({ id: '1', status: 'ACTIVE' });

    attendanceRepo.findExistingCheckIn.mockResolvedValue({
      id: 'attendance-1',
    });

    await expect(service.markAttendance('1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should create attendance if no duplicate and member is ACTIVE', async () => {
    memberRepo.findById.mockResolvedValue({ id: '1', status: 'ACTIVE' });

    attendanceRepo.findExistingCheckIn.mockResolvedValue(null);

    attendanceRepo.create.mockResolvedValue({
      id: 'attendance-1',
      memberId: '1',
    });

    const result = await service.markAttendance('1', 'DEVICE-123');

    expect(attendanceRepo.create).toHaveBeenCalledWith({
      memberId: '1',
      deviceInfo: 'DEVICE-123',
    });

    expect(result.id).toBe('attendance-1');
  });
});
