import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Initialize Fastify Adapter
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const host = configService.get<string>('HOST', '0.0.0.0');
  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3000');

  // CORS Whitelist Configuration
  app.enableCors({
    origin: corsOrigins.includes('*') ? '*' : corsOrigins.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global Input Validation Pipeline (class-validator / class-transformer)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // OpenAPI Swagger Documentation Setup (@nestjs/swagger + @fastify/static)
  const config = new DocumentBuilder()
    .setTitle('RestaurantOS — Master Backend API')
    .setDescription(
      'Production-grade NestJS REST & Real-time API for RestaurantOS powered by Fastify, Supabase PostgreSQL, and Drizzle ORM.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Supabase Bearer Token',
        description: 'Provide valid Supabase JWT Bearer token',
      },
      'bearer',
    )
    .addTag('Tables & Sessions', 'QR code verification and table dining sessions')
    .addTag('Menu & Catalog', 'Food categories, dishes, modifiers, and options')
    .addTag('Orders & Checkout', 'Server-verified order creation, calculations, and tracking')
    .addTag('Service Actions & Alerts', 'Staff call with 120s anti-spam cooldown and bill checkout')
    .addTag('Admin & POS Operations', 'Dish 86-switch availability, KDS status updates, and POS table settlement')
    .addTag('Authentication', 'Supabase token validation and user profile')
    .addTag('Health', 'Service and database health monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port, host);
  logger.log(`🚀 RestaurantOS Backend is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger OpenAPI documentation available at: http://localhost:${port}/docs`);
}

bootstrap();
