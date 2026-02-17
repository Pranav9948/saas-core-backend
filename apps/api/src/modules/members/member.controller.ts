import { Request, Response, NextFunction } from 'express';
import { MemberService } from './member.service.js';

const memberService = new MemberService();

type MemberParams = {
  id: string;
};

export const createMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const member = await memberService.createMember(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

export const getAllMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const member = await memberService.listMembers(page, limit);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

export const getMemberById = async (
  req: Request<MemberParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const member = await memberService.getMember(req.params.id);
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (
  req: Request<MemberParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await memberService.updateMember(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteMember = async (
  req: Request<MemberParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    await memberService.deleteMember(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Member successfully deactivated (soft-deleted)',
    });
  } catch (error) {
    next(error);
  }
};

export const getMemberHistory = async (
  req: Request<MemberParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const history = await memberService.getMemberHistory(req.params.id);
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};
