import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DRIZZLE_PROVIDER, POSTGRES_CLIENT } from './database.constants';
import * as schema from './schema';

export type DrizzleDB = PostgresJsDatabase<typeof schema>;

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) public readonly db: DrizzleDB,
    @Inject(POSTGRES_CLIENT) private readonly client: postgres.Sql,
  ) {}

  /**
   * Healthcheck helper to verify live connection to Supabase PostgreSQL
   */
  async ping(): Promise<boolean> {
    try {
      await this.client`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database ping failed', error);
      return false;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing database connection pool...');
    await this.client.end({ timeout: 5 });
  }
}
