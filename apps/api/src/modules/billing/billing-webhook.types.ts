import type { SubscriptionStatus } from '@/generated/prisma/client.js';

export interface SubscriptionSyncData {
  tenantId: string;
  planId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface WebhookProcessingResult {
  result: 'success' | 'duplicate' | 'skipped';
  tenantId?: string;
  stripeSubscriptionId?: string;
}
