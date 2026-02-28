import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client.js';
import { config } from '@/core/config.js';
import { logger } from '@/core/logger.js';

// SAFETY CHECK
if (
  config.NODE_ENV === 'test' &&
  config.DATABASE_URL.includes('dev_saas_backend')
) {
  throw new Error(
    '❌ CRITICAL: Test environment is pointing to the Development Database!',
  );
}

const pool = new pg.Pool({ connectionString: config.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log:
    config.NODE_ENV === 'test' ? ['error'] : ['query', 'info', 'warn', 'error'],
} as any);

export const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info(
      `✅ Connected to ${config.NODE_ENV} database: ${config.DATABASE_URL.split('/').pop()}`,
    );
  } catch (err) {
    logger.error({ err }, '❌ Database connection failed');
    process.exit(1);
  }
};

export const disConnectDB = async () => {
  await prisma.$disconnect();
};
