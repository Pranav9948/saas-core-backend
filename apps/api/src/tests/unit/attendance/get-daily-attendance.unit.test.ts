import { AttendanceService } from '@/modules/attendance/attendance.service.js';
import { jest } from '@jest/globals';

describe('AttendanceService - getDailyAttendance', () => {
  let service: AttendanceService;
  let attendanceRepo: any;

  beforeEach(() => {
    attendanceRepo = {
      findByDateRange: jest.fn(),
    };

    service = new AttendanceService(attendanceRepo as any, {} as any);
  });

  it('should fetch today attendance when no dateString provided', async () => {
    attendanceRepo.findByDateRange.mockResolvedValue([{ id: '1' }]);

    const result = await service.getDailyAttendance();

    expect(attendanceRepo.findByDateRange).toHaveBeenCalled();
    expect(result).toEqual([{ id: '1' }]);
  });

  it('should fetch attendance for specific date', async () => {
    attendanceRepo.findByDateRange.mockResolvedValue([{ id: '2' }]);

    const result = await service.getDailyAttendance('2025-01-01');

    expect(attendanceRepo.findByDateRange).toHaveBeenCalled();
    expect(result).toEqual([{ id: '2' }]);
  });

  it('should return empty array if no attendance found', async () => {
    attendanceRepo.findByDateRange.mockResolvedValue([]);

    const result = await service.getDailyAttendance();

    expect(result).toEqual([]);
  });
});
