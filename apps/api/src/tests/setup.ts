import { logger } from '@/core/logger.js';
import { prisma } from '@/infra/db.js';

beforeAll(async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Tests must run in NODE_ENV=test');
  }
});

// This is the "Magic" that keeps your tests clean
beforeEach(async () => {
  // Get all table names
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE;`,
        );
      } catch (error) {
        logger.info({ error });
      }
    }
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
