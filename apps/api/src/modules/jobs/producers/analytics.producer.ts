import { analyticsQueue } from '../queues/analytics.queue.js';

export const enqueueDailyAnalytics = async (date: Date) => {
  await analyticsQueue.add(
    'daily-attendance-analytics',
    { date },
    {
      jobId: `analytics-${date.toISOString()}`, // idempotent
    },
  );
};
