import { JobsOptions } from 'bullmq';

export const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: { count: 50 },
  removeOnFail: { count: 50 },
};
