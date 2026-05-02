import { logger } from '../../core/logger.js';
import { resetPasswordTemplate } from '../../templates/email/reset-password.template.js';
import {
  getInviteUserTemplate,
  getResetPasswordTemplate,
} from '../../templates/templates.js';
import { EmailJobData } from '../../types/email.types.js';
import {
  isAlreadyProcessed,
  markAsProcessed,
} from '../../utils/idempotency.js';
import { sendEmail } from '../../utils/mail.js';

export const emailProcessor = {
  async resetPassword(data: Extract<EmailJobData, { type: 'RESET_PASSWORD' }>) {
    const key = `email-${data.type}-${data.to}`;

    if (await isAlreadyProcessed(key)) {
      logger.info({ key }, 'Duplicate email skipped');
      return;
    }

    try {
      logger.info(
        {
          to: data.to,
          type: data.type,
        },
        'Preparing reset password email',
      );

      const html = resetPasswordTemplate({
        name: data.payload.name,
        resetUrl: data.payload.resetUrl,
      });

      logger.info(
        {
          to: data.to,
        },
        'Sending reset password email',
      );

      await sendEmail(data.to, 'Reset your password', html);

      await markAsProcessed(key);

      logger.info(
        {
          to: data.to,
        },
        'Reset password email sent',
      );
    } catch (err: any) {
      logger.error(
        {
          to: data.to,
          error: err.message,
          payload: data,
        },
        'Reset password email failed',
      );

      throw err;
    }
  },

  async inviteUser(data: Extract<EmailJobData, { type: 'INVITE_USER' }>) {
    try {
      logger.info(
        {
          to: data.to,
          type: data.type,
        },
        'Preparing invite user email',
      );

      const html = getInviteUserTemplate(
        data.payload.link,
        data.payload.name,
        data.payload.gymName,
        data.payload.role,
      );

      logger.info(
        {
          to: data.to,
        },
        'Sending invite user email',
      );

      await sendEmail(
        data.to,
        `You're Invited to Join ${data.payload.gymName}`,
        html,
      );

      logger.info(
        {
          to: data.to,
        },
        'Invite user email sent',
      );
    } catch (err: any) {
      logger.error(
        {
          to: data.to,
          error: err.message,
          payload: data,
        },
        'Invite user email failed',
      );

      throw err;
    }
  },

  async loginAlert(data: Extract<EmailJobData, { type: 'LOGIN_ALERT' }>) {
    try {
      logger.info(
        {
          to: data.to,
          type: data.type,
        },
        'Preparing login alert email',
      );

      const html = '<p>You logged in</p>';

      logger.info(
        {
          to: data.to,
        },
        'Sending login alert email',
      );

      await sendEmail(data.to, 'Login Alert', html);

      logger.info(
        {
          to: data.to,
        },
        'Login alert email sent',
      );
    } catch (err: any) {
      logger.error(
        {
          to: data.to,
          error: err.message,
          payload: data,
        },
        'Login alert email failed',
      );

      throw err;
    }
  },
};
