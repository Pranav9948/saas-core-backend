import { JobsOptions } from 'bullmq';

export const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};
