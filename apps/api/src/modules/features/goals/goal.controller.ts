import { Request, Response, NextFunction } from 'express';
import { GoalService } from './goal.service.js';

const goalService = new GoalService();

export const createGoal = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;
    const memberId = req.params.memberId as string;

    const goal = await goalService.createGoal(memberId, tenantId, req.body);

    res.status(201).json({
      success: true,
      data: goal,
    });
  } catch (err) {
    next(err);
  }
};

export const getGoals = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;
    const memberId = req.params.memberId as string;

    const goals = await goalService.getGoals(memberId, tenantId);

    res.status(200).json({
      success: true,
      data: goals,
    });
  } catch (err) {
    next(err);
  }
};
