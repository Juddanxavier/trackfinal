import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './notification-processor';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationLogsService } from './notification-logs.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationCleanupService } from './notification-cleanup.service';
import { WhatsAppService } from './whatsapp.service';
import { NotificationsService } from './notifications.service';
import { NotificationService } from './notification.service';
import { EmailModule } from '../email/email.module';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationsController } from './notifications.controller';
import { EmailChannel } from './channels/email.channel';
import { WhatsAppChannel } from './channels/whatsapp.channel';
import { InAppChannel } from './channels/in-app.channel';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    EmailModule,
    EventsModule,
    UsersModule,
  ],
  controllers: [NotificationPreferencesController, NotificationsController],
  providers: [
    NotificationProcessor,
    NotificationQueueService,
    NotificationLogsService,
    NotificationPreferencesService,
    NotificationCleanupService,
    WhatsAppService,
    NotificationsService,
    NotificationService,
    EmailChannel,
    WhatsAppChannel,
    InAppChannel,
  ],
  exports: [
    NotificationsService,
    NotificationQueueService,
    NotificationLogsService,
    NotificationPreferencesService,
    NotificationCleanupService,
    WhatsAppService,
    NotificationService,
    EmailChannel,
    WhatsAppChannel,
    InAppChannel,
  ],
})
export class NotificationsModule {}
