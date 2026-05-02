import { delay } from 'bullmq';
import { emailQueue } from '../queues/email.queue.js';
import { NotificationJobData } from '../../jobs/types/notification.types.js';

export type EmailJobData =
  | {
      type: 'RESET_PASSWORD';
      to: string;
      tenantId: string;
      payload: {
        resetUrl: string;
        name: string;
      };
    }
  | {
      type: 'INVITE_USER';
      to: string;
      tenantId: string;
      payload: {
        link: string;
        name: string;
        gymName: string;
        role: string;
      };
    }
  | {
      type: 'LOGIN_ALERT';
      to: string;
      tenantId: string;
      payload: Record<string, never>;
    };

export const sendEmailJob = async (data: EmailJobData) => {
  // Keep the "email:*" jobName for easier filtering,
  // but always include `channel` so notification-service can route it.
  const payload: NotificationJobData = {
    channel: 'email',
    type: data.type,
    to: data.to,
    tenantId: data.tenantId,
    payload: data.payload,
  };

  await emailQueue.add(`email:${data.type}`, payload, {
    jobId: `email-${data.type}-${data.to}-${Date.now()}`,
  });
};

export const sendNotificationJob = async (data: NotificationJobData) => {
  await emailQueue.add('notification', data, {
    jobId: `notif-${data.channel}-${data.type}-${data.to}-${Date.now()}`,
  });
};
