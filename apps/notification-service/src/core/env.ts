import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { loadAndValidateEnv } from '@saas/core';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  REDIS_HOST: z.string().min(1, 'REDIS_HOST is required'),
  REDIS_PORT: z.coerce.number().int().positive('REDIS_PORT must be valid'),

  MAIL_HOST: z.string().min(1, 'MAIL_HOST is required'),
  MAIL_PORT: z.coerce.number().int().positive('MAIL_PORT must be a valid port'),
  // Optional in local docker when using MailHog (no auth).
  MAIL_USER: z.string().optional().default(''),
  MAIL_PASS: z.string().optional().default(''),

  HEALTH_PORT: z.coerce.number().int().positive().default(4001),
}).superRefine((val, ctx) => {
  const usingMailhog = val.MAIL_HOST === 'mailhog';
  if (!usingMailhog) {
    if (!val.MAIL_USER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MAIL_USER'],
        message: 'MAIL_USER is required (unless MAIL_HOST=mailhog)',
      });
    }
    if (!val.MAIL_PASS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MAIL_PASS'],
        message: 'MAIL_PASS is required (unless MAIL_HOST=mailhog)',
      });
    }
  }
});

const serviceRootDir = (() => {
  const fromRepoRoot = path.resolve(process.cwd(), 'apps', 'notification-service');
  return fs.existsSync(fromRepoRoot) ? fromRepoRoot : process.cwd();
})();

export const env = loadAndValidateEnv(envSchema, {
  serviceName: 'notification-service',
  serviceRootDir,
  nodeEnv: process.env.NODE_ENV,
}).env;

