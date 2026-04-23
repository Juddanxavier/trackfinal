import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './notification-processor';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationLogsService } from './notification-logs.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationCleanupService } from './notification-cleanup.service';
import { WhatsAppService } from './whatsapp.service';
import { NotificationsService } from './notifications.service';
import { EmailModule } from '../email/email.module';
import { EventsModule } from '../events/events.module';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationsController } from './notifications.controller';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ...(isProduction
      ? [
          BullModule.forRoot({
            connection: {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379'),
            },
          }),
          BullModule.registerQueue({
            name: 'notifications',
          }),
        ]
      : []),
    EmailModule,
    EventsModule,
  ],
  controllers: [NotificationPreferencesController, NotificationsController],
  providers: [
    ...(isProduction ? [NotificationProcessor] : []),
    NotificationQueueService,
    NotificationLogsService,
    NotificationPreferencesService,
    NotificationCleanupService,
    WhatsAppService,
    NotificationsService,
  ],
  exports: [
    NotificationsService,
    NotificationQueueService,
    NotificationLogsService,
    NotificationPreferencesService,
    NotificationCleanupService,
    WhatsAppService,
  ],
})
export class NotificationsModule {}