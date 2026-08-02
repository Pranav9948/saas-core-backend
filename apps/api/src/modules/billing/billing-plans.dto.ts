import type {
  BillingInterval,
  PlanName,
  SubscriptionStatus,
} from '@/generated/prisma/client.js';

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

export interface BillingSubscriptionPlanDto {
  name: PlanName;
  description: string;
  price: number;
  currency: string;
}

export interface BillingSubscriptionReadRow {
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  plan: BillingSubscriptionPlanSnapshot;
}

export interface BillingSubscriptionPlanSnapshot {
  name: PlanName;
  price: number;
  currency: string;
  interval: BillingInterval;
}

export interface BillingSubscriptionResponseDto {
  plan: BillingSubscriptionPlanDto;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isPaid: boolean;
}
