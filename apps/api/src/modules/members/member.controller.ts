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
    const tenantId = req.user!.tenantId;
    const member = await memberService.createMember(req.body, tenantId);
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
    const tenantId = req.user!.tenantId;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const packageId =
      typeof req.query.packageId === 'string' ? req.query.packageId : undefined;
    const paymentStatus =
      typeof req.query.paymentStatus === 'string'
        ? (req.query.paymentStatus as
            | 'PAID'
            | 'PENDING'
            | 'OVERDUE'
            | 'UNPAID')
        : undefined;
    const expirationWindow =
      typeof req.query.expirationWindow === 'string'
        ? (req.query.expirationWindow as
            | 'expiring_7'
            | 'expiring_today'
            | 'expired')
        : undefined;
    const search =
      typeof req.query.search === 'string' ? req.query.search : undefined;

    const result = await memberService.listMembers(page, limit, tenantId, {
      packageId,
      paymentStatus,
      expirationWindow,
      search,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
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
    const tenantId = req.user!.tenantId;
    const memberId = req.params.id;

    const member = await memberService.getMember(memberId, tenantId);

    res.status(200).json({
      success: true,
      data: member,
    });
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
    const tenantId = req.user!.tenantId;
    const data = await memberService.updateMember(
      req.params.id,
      req.body,
      tenantId,
    );
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
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;

    await memberService.deleteMember(req.params.id, tenantId, userId);

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
    const tenantId = req.user!.tenantId;
    const history = await memberService.getMemberHistory(
      req.params.id,
      tenantId,
    );
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

export const sendRenewalReminder = async (
  req: Request<MemberParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await memberService.sendRenewalReminder(
      req.params.id,
      req.user!.tenantId,
    );
    res.status(200).json({
      success: true,
      data: result,
      message: 'Renewal reminder email sent',
    });
  } catch (error) {
    next(error);
  }
};
