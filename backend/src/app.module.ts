import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { TablesModule } from './modules/tables/tables.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ServiceRequestsModule } from './modules/service-requests/service-requests.module';
import { AdminModule } from './modules/admin/admin.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    // Global environment configuration with Zod validation
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    // Global Drizzle Database Module (Supabase PostgreSQL)
    DatabaseModule,

    // Feature Modules
    AuthModule,
    HealthModule,
    TablesModule,
    MenuModule,
    OrdersModule,
    ServiceRequestsModule,
    AdminModule,
    RealtimeModule,
  ],
  providers: [
    // Global Supabase Auth Guard (Requires Bearer token by default, overridden by @Public())
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    // Global Fastify Exception Filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global Request Latency & Tracing Logger
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Global Response Formatter
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
