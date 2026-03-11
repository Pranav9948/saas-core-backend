import { Request, Response } from 'express';
import * as UserService from './user.service.js';
import { logger } from '@/core/logger.js';

export const handleCreateUser = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { email, name } = req.body;
    const user = await UserService.createUser(email, name, tenantId);
    res.status(201).json(user);
  } catch (error) {
    logger.error({ error }, 'User creation failed');
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const handleGetUser = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const tenantId = req.user!.tenantId;

  const user = await UserService.getUserById(id, tenantId);
  user ? res.json(user) : res.status(404).json({ error: 'Not found' });
};
