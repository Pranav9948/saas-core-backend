import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

// Validate process.env
const _config = envSchema.safeParse(process.env);

if (!_config.success) {
  console.error('❌ Invalid environment variables:', _config.error.format());
  process.exit(1); // Stop the app immediately
}

export const config = _config.data;
export type Config = z.infer<typeof envSchema>;