declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string;
        roleId: string;
        role: string;
      };
      requestId: string;
      startTime: number;
    }
  }
}

export {};
