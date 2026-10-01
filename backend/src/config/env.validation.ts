import { envSchema, EnvConfig } from './env.schema';

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formattedErrors = result.error.format();
    const errorMessages = Object.entries(formattedErrors)
      .filter(([key]) => key !== '_errors')
      .map(([key, value]) => `  - ${key}: ${(value as { _errors: string[] })._errors.join(', ')}`)
      .join('\n');

    throw new Error(
      `\n❌ Invalid environment configuration:\n${errorMessages}\n\nPlease check your .env file.\n`,
    );
  }

  return result.data;
}
