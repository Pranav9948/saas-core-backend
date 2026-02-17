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
    const trainer = await trainerService.registerTrainer(req.body);
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
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await trainerService.getTrainers(page, limit);
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
    const trainer = await trainerService.getTrainerProfile(req.params.id);
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
    const data = await trainerService.updateTrainer(req.params.id, req.body);
    res.status(200).json({ success: true, data });
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
    await trainerService.deleteTrainer(req.params.id);
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
    const members = await trainerService.getTrainerMembers(req.params.id);
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};
