import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DRIZZLE_PROVIDER, POSTGRES_CLIENT } from './database.constants';
import { DatabaseService } from './database.service';
import * as schema from './schema';

@Global()
@Module({
  providers: [
    {
      provide: POSTGRES_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL')!;
        
        // Robust resolution for postgres callable across CommonJS/ESM
        const createPostgresClient = typeof postgres === 'function' ? postgres : (postgres as any).default;

        // Supabase Pooled Connection (PgBouncer/Supavisor Transaction mode on port 6543)
        // CRITICAL: prepare: false is mandatory when using Supabase transaction poolers
        const client = createPostgresClient(databaseUrl, {
          prepare: false,
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
        });

        return client;
      },
    },
    {
      provide: DRIZZLE_PROVIDER,
      inject: [POSTGRES_CLIENT],
      useFactory: (client: postgres.Sql) => {
        return drizzle(client, { schema });
      },
    },
    DatabaseService,
  ],
  exports: [DRIZZLE_PROVIDER, POSTGRES_CLIENT, DatabaseService],
})
export class DatabaseModule {}
