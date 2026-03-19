import { Request, Response, NextFunction } from 'express';
import { TrainerService } from './trainer.service.js';

const trainerService = new TrainerService();

type TrainerParams = {
  id: string;
};

export const createTrainer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;
    const trainer = await trainerService.registerTrainer(req.body, tenantId);
    res.status(201).json({ success: true, data: trainer });
  } catch (error) {
    next(error);
  }
};

export const listTrainers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const result = await trainerService.getTrainers(page, limit, tenantId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getTrainer = async (
  req: Request<TrainerParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;
    const trainerId = req.params.id;

    const trainer = await trainerService.getTrainerProfile(trainerId, tenantId);

    res.status(200).json({ success: true, data: trainer });
  } catch (error) {
    next(error);
  }
};

export const updateTrainer = async (
  req: Request<TrainerParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;
    const trainerId = req.params.id;

    const updatedTrainer = await trainerService.updateTrainer(
      trainerId,
      req.body,
      tenantId,
    );

    res.status(200).json({
      success: true,
      data: updatedTrainer,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTrainer = async (
  req: Request<TrainerParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;
    await trainerService.deleteTrainer(req.params.id, tenantId);
    res.status(200).json({
      success: true,
      message: 'Trainer profile deleted and role reverted.',
    });
  } catch (error) {
    next(error);
  }
};

export const getTrainerMembers = async (
  req: Request<TrainerParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.tenantId;
    const trainerId = req.params.id;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const result = await trainerService.getTrainerMembers(
      trainerId,
      tenantId,
      page,
      limit,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
