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
