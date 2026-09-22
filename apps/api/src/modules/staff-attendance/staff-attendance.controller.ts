import { NextFunction, Request, Response } from 'express';
import { StaffAttendanceService } from './staff-attendance.service.js';

const staffAttendanceService = new StaffAttendanceService();

export const getStaffMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await staffAttendanceService.getStaffMetrics(req.user!.tenantId, {
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
      range:
        typeof req.query.range === 'string'
          ? (req.query.range as 'this_month' | 'last_month' | 'custom')
          : undefined,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const markStaffAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await staffAttendanceService.markAttendance(
      req.user!.tenantId,
      req.body,
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getTrainerOverview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await staffAttendanceService.getTrainerOverview(
      req.user!.tenantId,
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getTrainerPerformance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await staffAttendanceService.getTrainerPerformance(
      String(req.params.id),
      req.user!.tenantId,
      {
        from: typeof req.query.from === 'string' ? req.query.from : undefined,
        to: typeof req.query.to === 'string' ? req.query.to : undefined,
        range:
          typeof req.query.range === 'string'
            ? (req.query.range as 'this_month' | 'last_month' | 'custom')
            : undefined,
      },
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
