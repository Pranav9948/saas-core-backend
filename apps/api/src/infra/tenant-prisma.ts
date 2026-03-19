import { Prisma, PrismaClient } from '@/generated/prisma/client.js';

const TENANT_MODELS = ['Member', 'Trainer', 'Attendance'];

export const getTenantPrisma = (prisma: PrismaClient, tenantId: string) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({
          args,
          query,
        }: {
          args: Prisma.Args<any, 'findMany'>;
          query: any;
        }) {
          args.where = {
            ...(args.where ?? {}),
            tenantId,
          };

          return query(args);
        },

        async findFirst({
          args,
          query,
        }: {
          args: Prisma.Args<any, 'findFirst'>;
          query: any;
        }) {
          args.where = {
            ...(args.where ?? {}),
            tenantId,
          };

          return query(args);
        },

        async update({
          model,
          args,
          query,
        }: {
          model?: string;
          args: Prisma.Args<any, 'update'>;
          query: any;
        }) {
          if (model && TENANT_MODELS.includes(model)) {
            args.where = {
              ...(args.where ?? {}),
              tenantId,
            };
          }

          return query(args);
        },

        async delete({
          args,
          query,
        }: {
          args: Prisma.Args<any, 'delete'>;
          query: any;
        }) {
          args.where = {
            ...(args.where ?? {}),
            tenantId,
          };

          return query(args);
        },
      },
    },
  });
};
