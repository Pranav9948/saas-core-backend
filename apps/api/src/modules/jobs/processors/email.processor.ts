import { sendEmail } from '../../../utils/mail.js';

export const emailProcessor = {
  async send(data: {
    to: string;
    subject: string;
    html: string;
    tenantId: string;
  }) {
    await sendEmail(data.to, data.subject, data.html);
  },
};
