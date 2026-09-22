import { emailProcessor } from '../processors/email/email.processor';
import { pushProcessor } from '../processors/push/push.processor';
import { smsProcessor } from '../processors/sms/sms.processor';

type EmailType =
  | 'RESET_PASSWORD'
  | 'INVITE_USER'
  | 'LOGIN_ALERT'
  | 'MEMBER_RENEWAL_REMINDER';

const emailHandlers: Record<EmailType, (data: any) => Promise<void>> = {
  RESET_PASSWORD: emailProcessor.resetPassword,
  INVITE_USER: emailProcessor.inviteUser,
  LOGIN_ALERT: emailProcessor.loginAlert,
  MEMBER_RENEWAL_REMINDER: emailProcessor.renewalReminder,
};

export const notificationRouter = async (job: any) => {
  const channel =
    job?.data?.channel ??
    (typeof job?.name === 'string' && job.name.startsWith('email:')
      ? 'email'
      : undefined);
  const type = job?.data?.type;

  switch (channel) {
    case 'email': {
      const handler = emailHandlers[type as EmailType];

      if (!handler) {
        throw new Error(`Unknown email type: ${type}`);
      }

      return handler(job.data);
    }

    case 'sms':
      return smsProcessor.send(job.data);

    case 'push':
      return pushProcessor.send(job.data);

    default:
      throw new Error(`Unknown channel: ${channel}`);
  }
};
