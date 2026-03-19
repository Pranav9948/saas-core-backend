const getResetPasswordTemplate = (resetUrl: string, name: string) => {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to choose a new one. This link will expire in 1 hour.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
      <p style="font-size: 0.8em; color: #777;">Sent from Gym SaaS Team</p>
    </div>
  `;
};

const getInviteUserTemplate = (
  inviteUrl: string,
  name: string,
  gymName: string,
  role: string,
) => {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
      
      <h2 style="color: #333;">You're Invited to Join ${gymName}</h2>
      
      <p>Hi ${name},</p>
      
      <p>
        You have been invited to join <strong>${gymName}</strong> as 
        <strong>${role}</strong>.
      </p>

      <p>
        Click the button below to accept the invitation and set up your account.
        This link will expire in <strong>24 hours</strong>.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a 
          href="${inviteUrl}" 
          style="
            background-color: #28a745; 
            color: white; 
            padding: 12px 25px; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: bold;
          "
        >
          Accept Invitation
        </a>
      </div>

      <p>
        If you were not expecting this invitation, you can safely ignore this email.
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">

      <p style="font-size: 0.8em; color: #777;">
        Sent from Gym SaaS Team
      </p>
    </div>
  `;
};

export { getResetPasswordTemplate, getInviteUserTemplate };
