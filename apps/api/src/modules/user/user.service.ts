import { prisma } from '@/infra/db.js';
import { Security } from '@/core/security.js';

export const createUser = async (
  email: string,
  firstName: string,
  lastName: string,
  password: string,
  tenantId: string,
) => {
  void tenantId;
  return await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      passwordHash: await Security.hashPassword(password),
    },
  });
};

export const getUserById = async (id: string, tenantId: string) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};
