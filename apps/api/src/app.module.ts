import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganisationsModule } from './modules/organisations/organisations.module';
import { EventsModule } from './modules/events/events.module';
import { EmailModule } from './modules/email/email.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CarriersModule } from './modules/carriers/carriers.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 5,
      },
      {
        name: 'medium',
        ttl: 300000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
      },
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    OrganisationsModule,
    EventsModule,
    EmailModule,
    QuotesModule,
    NotificationsModule,
    ShipmentsModule,
    ReportsModule,
    CarriersModule,
    TrackingModule,
  ],
  controllers: [AppController],
  providers: [AppService, RequestLoggingMiddleware],
})
export class AppModule {}
