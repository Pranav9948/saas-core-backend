import { JobsOptions } from 'bullmq';

export const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  // Keep only last 100 successful jobs, delete the rest
  removeOnComplete: { count: 100 },
  // Keep only last 50 failed jobs for debugging
  removeOnFail: { count: 50 },
};
