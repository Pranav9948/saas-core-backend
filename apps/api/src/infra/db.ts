import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { PrismaClient } from '@/generated/prisma/client.js';

config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('❌ DATABASE_URL is not defined');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
} as any);

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
};

const disConnectDB = async () => {
  await prisma.$disconnect();
};

export { prisma, connectDB, disConnectDB };   
