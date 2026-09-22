import nodemailer from 'nodemailer';
import { config } from '@/core/config.js';
import { logger } from '@/core/logger.js';

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

export async function sendTransactionalEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  logger.info({
    msg: 'Sending transactional email',
    to: options.to,
    subject: options.subject,
    mailHost: config.MAIL_HOST,
  });

  await transporter.sendMail({
    from: `"GymFlow" <${config.MAIL_USER || 'noreply@gymflow.local'}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export function membershipRenewalTemplate(payload: {
  memberName: string;
  gymName: string;
  packageName: string;
  expirationDate: string;
  remainingDays: number;
}): string {
  const urgency =
    payload.remainingDays < 0
      ? `Your membership expired ${Math.abs(payload.remainingDays)} day(s) ago.`
      : payload.remainingDays === 0
        ? 'Your membership expires today.'
        : `Your membership expires in ${payload.remainingDays} day(s).`;

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
      <h2 style="color: #111;">Time to renew your membership</h2>
      <p>Hi ${payload.memberName},</p>
      <p>${urgency}</p>
      <p>
        Your <strong>${payload.packageName}</strong> package at
        <strong>${payload.gymName}</strong> is set to end on
        <strong>${payload.expirationDate}</strong>.
      </p>
      <p>Visit the gym or reply to this email to renew and keep training without interruption.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
      <p style="font-size: 0.8em; color: #777;">Sent from ${payload.gymName} via GymFlow</p>
    </div>
  `;
}
