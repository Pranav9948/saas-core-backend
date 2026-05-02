import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { loadAndValidateEnv } from '@saas/core';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid database connection string'),

  JWT_ACCESS_SECRET: z
    .string()
    .min(10, 'JWT_ACCESS_SECRET must be at least 10 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(10, 'JWT_REFRESH_SECRET must be at least 10 characters'),

  SUPER_ADMIN_ACCESS_SECRET: z
    .string()
    .min(10, 'SUPER_ADMIN_ACCESS_SECRET must be at least 10 characters'),
  SUPER_ADMIN_REFRESH_SECRET: z
    .string()
    .min(10, 'SUPER_ADMIN_REFRESH_SECRET must be at least 10 characters'),

  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),

  MAIL_HOST: z.string().min(1, 'MAIL_HOST is required'),
  MAIL_PORT: z.coerce.number().int().positive('MAIL_PORT must be a valid port'),
  MAIL_USER: z.string().min(1, 'MAIL_USER is required'),
  MAIL_PASS: z.string().min(1, 'MAIL_PASS is required'),

  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
  AWS_S3_BUCKET: z.string().min(1, 'AWS_S3_BUCKET is required'),

  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),

  REDIS_HOST: z.string().min(1, 'REDIS_HOST is required'),
  REDIS_PORT: z.coerce.number().int().positive('REDIS_PORT must be valid'),
});

const serviceRootDir = (() => {
  // Local dev typically runs from apps/api; Docker/dev scripts may run from repo root.
  const fromRepoRoot = path.resolve(process.cwd(), 'apps', 'api');
  return fs.existsSync(fromRepoRoot) ? fromRepoRoot : process.cwd();
})();

export const env = loadAndValidateEnv(envSchema, {
  serviceName: 'api',
  serviceRootDir,
  nodeEnv: process.env.NODE_ENV,
}).env;

