import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),

  // Database Connection URLs
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (pooled connection)'),
  DIRECT_URL: z.string().optional(),

  // Supabase Auth
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().min(1, 'SUPABASE_JWT_SECRET is required'),

  // Restaurant Business Financials
  RESTAURANT_NAME: z.string().default('Chaska & Chai Cafe'),
  CURRENCY_CODE: z.string().default('PKR'),
  CURRENCY_SYMBOL: z.string().default('Rs. '),
  SERVICE_CHARGE_PERCENT: z.coerce.number().default(5),
  TAX_PERCENT: z.coerce.number().default(5),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Cooldown & Rate Limits
  WAITER_COOLDOWN_SECONDS: z.coerce.number().default(120),
  ORDER_RATE_LIMIT_PER_MINUTE: z.coerce.number().default(5),
});

export type EnvConfig = z.infer<typeof envSchema>;
