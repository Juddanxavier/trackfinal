import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as Sentry from '@sentry/nestjs';
import { AppModule } from './app.module';
import { ThrottlerExceptionFilter } from './filters/throttler-exception.filter';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';

async function migrateCarriers() {
  console.log('[Carrier Migration] Starting...');
  try {
    const db = await import('./database/index.js').then((m) => m.db);
    const { carriers } = await import('./database/schema/carriers.js');

    try {
      const [existing] = await db.select({ key: carriers.key }).from(carriers).limit(1);
      if (existing) {
        console.log('[Carrier Migration] Already loaded, skipping');
        return;
      }
    } catch (e) {
      console.log('[Carrier Migration] Table may not exist, will create');
    }

    console.log('[Carrier Migration] Creating table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS carriers (
        key VARCHAR(20) PRIMARY KEY,
        name_en VARCHAR(255) NOT NULL,
        name_cn VARCHAR(255),
        name_hk VARCHAR(255),
        url VARCHAR(500)
      )
    `);
    console.log('[Carrier Migration] Table created');

    const fs = await import('fs');
    const path = await import('path');
    const csvPath = path.join(__dirname, 'carriers.csv');
    console.log('[Carrier Migration] CSV path:', csvPath);
    
    if (!fs.existsSync(csvPath)) {
      console.error('[Carrier Migration] CSV file not found at:', csvPath);
      return;
    }
    
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').slice(1);
    console.log('[Carrier Migration] Lines to process:', lines.length);

    let inserted = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const [key, name_en, name_cn, name_hk, url] = trimmed.split(',');
      if (key && name_en) {
        await db
          .insert(carriers)
          .values({
            key,
            nameEn: name_en,
            nameCn: name_cn || null,
            nameHk: name_hk || null,
            url: url || null,
          })
          .onConflictDoNothing({
            target: carriers.key,
          });
        inserted++;
      }
    }
    console.log(`[Carrier Migration] Complete: ${inserted} carriers inserted`);
  } catch (err) {
    console.error('[Carrier Migration] FAILED:', err);
  }
}

async function migrateAdditionalColumns() {
  console.log('[Additional Columns Migration] Starting...');
  try {
    const db = await import('./database/index.js').then((m) => m.db);
    
    await db.execute(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS notify_on_update JSONB DEFAULT '{"email":true,"sms":false}'`);
    await db.execute(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS notify_email TEXT`);
    await db.execute(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS notify_phone TEXT`);
    await db.execute(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP`);
    await db.execute(`ALTER TABLE shipments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`);
    
    console.log('[Additional Columns Migration] Complete');
  } catch (err) {
    console.error('[Additional Columns Migration] FAILED:', err);
  }
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});

async function bootstrap() {
  await migrateCarriers();
  await migrateAdditionalColumns();

  const app = await NestFactory.create(AppModule);

  app.use(new RequestLoggingMiddleware().use);

  // Cookies
  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix('api');

  // Security
  app.use(helmet());
  const corsOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://track.corncob.my',
    'http://127.0.0.1:3000',
    'https://admin.gajantraders.com',
    'https://api.gajantraders.com',
  ];
  if (process.env.CORS_ORIGIN) {
    corsOrigins.push(...process.env.CORS_ORIGIN.split(','));
  }
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'Cookie',
    ],
    exposedHeaders: ['Set-Cookie'],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Track API')
    .setDescription('API Documentation for Track Application')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('organisations', 'Organisation management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalFilters(new ThrottlerExceptionFilter());

  await app.listen(process.env.PORT ?? 4000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 4000}`,
  );
  console.log(`API v1: http://localhost:${process.env.PORT ?? 4000}/api/v1`);
  console.log(`Swagger docs: http://localhost:${process.env.PORT ?? 4000}/api`);
}
bootstrap();
