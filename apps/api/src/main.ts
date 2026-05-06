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

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(new RequestLoggingMiddleware().use);

  // Cookies
  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix('api');

  // Security
  // app.use(helmet()); // Temporarily disabled for cookie testing
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
