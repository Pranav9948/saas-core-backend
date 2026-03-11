import { prisma } from '@/infra/db.js';

export const createUser = async (
  email: string,
  name: string,
  tenantId: string,
) => {
  return await prisma.user.create({
    data: { email, name },
  });
};

export const getUserById = async (id: string, tenantId: string) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};
