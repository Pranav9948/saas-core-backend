import { GoalRepository } from './goal.repository.js';
import {
  BadRequestException,
  NotFoundException,
} from '@/exceptions/exceptions.js';
import { ErrorCode } from '@/exceptions/root.js';
import { MemberRepository } from '@/modules/members/member.repository.js';

export class GoalService {
  constructor(
    private goalRepo = new GoalRepository(),
    private memberRepo = new MemberRepository(),
  ) {}

  async createGoal(
    memberId: string,
    tenantId: string,
    data: {
      goalType: 'GAIN' | 'LOSS';
      currentWeight: number;
      targetWeight: number;
      durationWeeks: number;
      height: number;
    },
  ) {
    // 1. Validate member exists
    const member = await this.memberRepo.findById(memberId, tenantId);
    if (!member) {
      throw new NotFoundException('Member not found', ErrorCode.NOT_FOUND);
    }

    if (data.goalType === 'LOSS' && data.targetWeight >= data.currentWeight) {
      throw new BadRequestException(
        'Target weight must be less than current weight for LOSS goal',
      );
    }

    if (data.goalType === 'GAIN' && data.targetWeight <= data.currentWeight) {
      throw new BadRequestException(
        'Target weight must be greater than current weight for GAIN goal',
      );
    }

    // 3. Weekly realistic check

    const weightDiff = Math.abs(data.currentWeight - data.targetWeight);
    const weeklyChange = weightDiff / data.durationWeeks;

    if (data.goalType === 'LOSS' && weeklyChange > 1) {
      throw new BadRequestException(
        'Weight loss should not exceed 1kg per week',
      );
    }

    if (data.goalType === 'GAIN' && weeklyChange > 0.5) {
      throw new BadRequestException(
        'Weight gain should not exceed 0.5kg per week',
      );
    }

    // 4. Deactivate old goals
    await this.goalRepo.deactivateExistingGoals(memberId, tenantId);

    // 5. Create new goal
    const goal = await this.goalRepo.create({
      memberId,
      tenantId,
      ...data,
    });

    return goal;
  }

  async getGoals(memberId: string, tenantId: string) {
    const goals = await this.goalRepo.findAllByMember(memberId, tenantId);

    return goals;
  }

  async getActiveGoal(memberId: string, tenantId: string) {
    return this.goalRepo.findActiveByMember(memberId, tenantId);
  }
}
