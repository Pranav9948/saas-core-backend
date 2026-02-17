import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from './attendance.service.js';

const attendanceService = new AttendanceService();

export const markAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { memberId, deviceInfo } = req.body;
    const record = await attendanceService.markAttendance(memberId, deviceInfo);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

export const getTodaysAttendance = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await attendanceService.getDailyAttendance();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceByDate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const date = req.query.date as string;
    const data = await attendanceService.getDailyAttendance(date);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getMemberStats = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const stats = await attendanceService.getMemberStats(req.params.id);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
