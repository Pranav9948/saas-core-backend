import type { PlanName } from '@/generated/prisma/client.js';
import { ForbiddenException } from './exceptions.js';
import { ErrorCode } from './root.js';
import type { Feature } from '@/modules/feature-usage/feature.enum.js';

export class FeatureLimitReachedException extends ForbiddenException {
  readonly code = 'FEATURE_LIMIT_REACHED';
  readonly feature: Feature;
  readonly currentPlan: PlanName;
  readonly limit: number;
  readonly used: number;

  constructor(params: {
    feature: Feature;
    currentPlan: PlanName;
    limit: number;
    used: number;
    message: string;
  }) {
    super(params.message, ErrorCode.FEATURE_LIMIT_REACHED);
    this.feature = params.feature;
    this.currentPlan = params.currentPlan;
    this.limit = params.limit;
    this.used = params.used;
  }
}
