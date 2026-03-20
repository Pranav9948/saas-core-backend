declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string;
        roleId: string;
      };
    }
  }
}

export {};
