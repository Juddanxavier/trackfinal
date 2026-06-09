import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './notification-processor';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationLogsService } from './notification-logs.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationCleanupService } from './notification-cleanup.service';
import { NotificationsService } from './notifications.service';
import { NotificationService } from './notification.service';
import { EmailModule } from '../email/email.module';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationsController } from './notifications.controller';
import { TestNotificationsController } from './test-notifications.controller';
import { EmailChannel } from './channels/email.channel';
import { WhatsAppChannel } from './channels/whatsapp.channel';
import { InAppChannel } from './channels/in-app.channel';
import { MSG91Module } from './msg91.module';
import { MSG91Service } from './msg91.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    EmailModule,
    EventsModule,
    UsersModule,
    MSG91Module,
  ],
  controllers: [
    NotificationPreferencesController,
    NotificationsController,
    ...(process.env.NODE_ENV !== 'production'
      ? [TestNotificationsController]
      : []),
  ],
  providers: [
    NotificationProcessor,
    NotificationQueueService,
    NotificationLogsService,
    NotificationPreferencesService,
    NotificationCleanupService,
    NotificationsService,
    NotificationService,
    EmailChannel,
    WhatsAppChannel,
    InAppChannel,
    MSG91Service,
  ],
  exports: [
    NotificationsService,
    NotificationQueueService,
    NotificationLogsService,
    NotificationPreferencesService,
    NotificationCleanupService,
    NotificationService,
    EmailChannel,
    WhatsAppChannel,
    InAppChannel,
    MSG91Service,
  ],
})
export class NotificationsModule {}
