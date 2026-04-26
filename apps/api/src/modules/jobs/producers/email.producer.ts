import { emailQueue } from '../queues/email.queue.js';

export const sendEmailJob = async (data: {
  to: string;
  subject: string;
  html: string;
  tenantId: string;
}) => {
  await emailQueue.add('send-email', data, {
    jobId: `email-${data.to}-${Date.now()}`,
  });
};
