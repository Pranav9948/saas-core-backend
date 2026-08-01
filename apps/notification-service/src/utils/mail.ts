import nodemailer from 'nodemailer';
import { logger } from '../core/logger.js';
import { config } from '../core/config.js';

const useAuth =
  Boolean(config.MAIL_USER) &&
  Boolean(config.MAIL_PASS) &&
  config.MAIL_HOST !== 'mailhog';

const transporter = nodemailer.createTransport({
  host: config.MAIL_HOST,
  port: config.MAIL_PORT,
  secure: String(config.MAIL_PORT) === '465',
  ...(useAuth
    ? {
        auth: {
          user: config.MAIL_USER,
          pass: config.MAIL_PASS,
        },
      }
    : {}),
});

const mailFrom =
  config.MAIL_FROM || config.MAIL_USER || 'noreply@gymflow.local';

export const sendEmail = async (to: string, subject: string, html: string) => {
  logger.info(
    {
      to,
      subject,
      mailHost: config.MAIL_HOST,
      mailPort: config.MAIL_PORT,
    },
    'Sending email',
  );

  await transporter.sendMail({
    from: `"GymFlow" <${mailFrom}>`,
    to,
    subject,
    html,
  });

  if (config.MAIL_HOST === 'mailhog') {
    logger.info(
      { mailhogUi: 'http://localhost:8025' },
      'Email captured by MailHog — open the UI to view it',
    );
  }
};
