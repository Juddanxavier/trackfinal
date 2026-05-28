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
import { InvoicesModule } from './modules/invoices/invoices.module';
// import { SecurityModule } from './modules/security/security.module';
import { SearchModule } from './modules/search/search.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { RedisCacheModule } from './modules/cache/cache.module';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { CasbinModule } from './common/casbin/casbin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
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
    InvoicesModule,
    WebhooksModule,
    MonitoringModule,
    RedisCacheModule,
    SearchModule,
    CasbinModule,
  ],
  controllers: [AppController],
  providers: [AppService, RequestLoggingMiddleware],
})
export class AppModule {}
