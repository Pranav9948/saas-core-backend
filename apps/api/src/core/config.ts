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
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid database connection string'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  JWT_ACCESS_SECRET: z
    .string()
    .min(10, 'JWT_ACCESS_SECRET must be at least 10 characters'),

  JWT_REFRESH_SECRET: z
    .string()
    .min(10, 'JWT_REFRESH_SECRET must be at least 10 characters'),

  MAIL_HOST: z.string().min(1, 'MAIL_HOST is required'),

  MAIL_PORT: z.coerce.number().int().positive('MAIL_PORT must be a valid port'),

  MAIL_USER: z.string().min(1, 'MAIL_USER is required'),

  MAIL_PASS: z.string().min(1, 'MAIL_PASS is required'),

  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),

  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),

  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),

  AWS_S3_BUCKET: z.string().min(1, 'AWS_S3_BUCKET is required'),
});

const _config = envSchema.safeParse(process.env);

if (!_config.success) {
  console.error('❌ Invalid environment variables:', _config.error.format());
  process.exit(1);
}

export const config = _config.data;
