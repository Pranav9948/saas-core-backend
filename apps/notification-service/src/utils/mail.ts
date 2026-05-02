import nodemailer from 'nodemailer';
import { logger } from '../core/logger.js';

const mailHost = process.env.MAIL_HOST;
const mailPort = Number(process.env.MAIL_PORT);
const useAuth =
  Boolean(process.env.MAIL_USER) &&
  Boolean(process.env.MAIL_PASS) &&
  mailHost !== 'mailhog';

const transporter = nodemailer.createTransport({
  host: mailHost,
  port: mailPort,
  secure: String(process.env.MAIL_PORT) === '465',
  ...(useAuth
    ? {
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      }
    : {}),
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  logger.info(`sendEmail sendEmail ${to},${subject},${html}`);
  await transporter.sendMail({
    from: `"Support Team" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
};
