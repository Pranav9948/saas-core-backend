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
    }
  | {
      type: 'MEMBER_RENEWAL_REMINDER';
      to: string;
      tenantId: string;
      payload: {
        name: string;
        gymName: string;
        packageName: string;
        expirationDate: string;
        remainingDays: number;
      };
    };
