import { logger } from '../core/logger';
import {
  getInviteUserTemplate,
  getResetPasswordTemplate,
} from '../templates/templates';
import { EmailJobData } from '../types/email.types';
import { sendEmail } from '../utils/mail';

export const emailProcessor = {
  async resetPassword(data: Extract<EmailJobData, { type: 'RESET_PASSWORD' }>) {
    const html = getResetPasswordTemplate(
      data.payload.resetUrl,
      data.payload.name,
    );
    await sendEmail(data.to, 'Reset your password', html);
  },

  async inviteUser(data: Extract<EmailJobData, { type: 'INVITE_USER' }>) {
    const html = getInviteUserTemplate(
      data.payload.link,
      data.payload.name,
      data.payload.gymName,
      data.payload.role,
    );
    await sendEmail(
      data.to,
      `You're Invited to Join ${data.payload.gymName}`,
      html,
    );
  },

  async loginAlert(data: Extract<EmailJobData, { type: 'LOGIN_ALERT' }>) {
    const html = '<p>You logged in</p>';
    logger.info(`data in loginAlert  ${data}: ${html}`);
    await sendEmail(data.to, 'Login Alert', html);
  },
};
