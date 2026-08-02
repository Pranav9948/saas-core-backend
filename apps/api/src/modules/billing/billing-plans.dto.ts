import type { BillingInterval, PlanName } from '@/generated/prisma/client.js';

export interface BillingPlanFeatureDto {
  key: string;
  value: string | number | boolean;
}

export interface BillingPlanCatalogRow {
  id: string;
  name: PlanName;
  price: number;
  currency: string;
  interval: BillingInterval;
  stripePriceId: string | null;
  features: unknown;
}

export interface BillingPlanDto {
  id: string;
  name: PlanName;
  description: string;
  price: number;
  currency: string;
  interval: BillingInterval;
  features: BillingPlanFeatureDto[];
  current: boolean;
}

export interface BillingPlansResponseDto {
  plans: BillingPlanDto[];
}

export const PLAN_DESCRIPTIONS: Record<PlanName, string> = {
  FREE: 'Essential tools to run your gym with core member and staff management.',
  BASIC: 'More capacity and features for growing fitness businesses.',
  PRO: 'Maximum limits and priority capabilities for established gyms.',
};
