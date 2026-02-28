import { NotFoundException } from '@/exceptions/exceptions.js';
import { AttendanceService } from '@/modules/attendance/attendance.service.js';
import { jest } from '@jest/globals';

describe('AttendanceService - getMemberStats', () => {
  let service: AttendanceService;
  let attendanceRepo: any;
  let memberRepo: any;

  beforeEach(() => {
    attendanceRepo = {
      getStats: jest.fn(),
    };

    memberRepo = {
      findById: jest.fn(),
    };

    service = new AttendanceService(attendanceRepo, memberRepo);
  });

  it('should throw NotFoundException if member does not exist', async () => {
    memberRepo.findById.mockResolvedValue(null);

    await expect(service.getMemberStats('member-id')).rejects.toThrow(
      NotFoundException,
    );

    expect(memberRepo.findById).toHaveBeenCalledWith('member-id');
  });

  it('should return stats if member exists', async () => {
    memberRepo.findById.mockResolvedValue({ id: '1' });

    attendanceRepo.getStats.mockResolvedValue({
      totalVisits: 5,
      lastVisit: '2025-01-01T10:00:00.000Z',
    });

    const result = await service.getMemberStats('1');

    expect(attendanceRepo.getStats).toHaveBeenCalledWith('1');
    expect(result.totalVisits).toBe(5);
  });

  it('should return zero visits if no attendance', async () => {
    memberRepo.findById.mockResolvedValue({ id: '1' });

    attendanceRepo.getStats.mockResolvedValue({
      totalVisits: 0,
      lastVisit: null,
    });

    const result = await service.getMemberStats('1');

    expect(result.totalVisits).toBe(0);
    expect(result.lastVisit).toBeNull();
  });
});
