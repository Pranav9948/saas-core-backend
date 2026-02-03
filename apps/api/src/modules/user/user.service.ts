import { prisma } from '@/infra/db.js';

export const createUser = async (email: string, name: string) => {
  return await prisma.user.create({
    data: { email, name },
  });
};

export const getUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};