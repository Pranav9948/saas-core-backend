export type NotificationJobData =
  | {
      channel: 'email';
      type: 'RESET_PASSWORD' | 'INVITE_USER' | 'LOGIN_ALERT';
      to: string;
      tenantId: string;
      payload: any;
    }
  | {
      channel: 'sms';
      type: string;
      to: string;
      tenantId: string;
      payload: any;
    }
  | {
      channel: 'push';
      type: string;
      to: string;
      tenantId: string;
      payload: any;
    };
