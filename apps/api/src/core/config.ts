import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

const isTest = process.env.NODE_ENV === 'test';

dotenv.config({
  path: path.resolve(process.cwd(), isTest ? '.env.test' : '.env'),
  override: true,
});

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

const _config = envSchema.safeParse(process.env);

if (!_config.success) {
  console.error('❌ Invalid environment variables:', _config.error.format());
  process.exit(1);
}

export const config = _config.data;
