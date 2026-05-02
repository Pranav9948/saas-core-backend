import { baseEmailLayout } from '../shared/layout.template';

type ResetPasswordTemplateData = {
  name: string;
  resetUrl: string;
};

export const resetPasswordTemplate = (data: ResetPasswordTemplateData) => {
  const content = `
    <h2>Hello ${data.name}</h2>
    <p>Click below to reset your password:</p>
    <a href="${data.resetUrl}">Reset Password</a>
  `;

  return baseEmailLayout(content);
};
