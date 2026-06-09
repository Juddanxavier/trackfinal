import { Injectable, Optional, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SendNotificationJob } from './notification-processor';
import { NotificationLogsService } from './notification-logs.service';

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);
  constructor(
    @Optional()
    @InjectQueue('notifications')
    private notificationQueue: Queue | undefined,
    private notificationLogsService: NotificationLogsService,
    private configService: ConfigService,
  ) {}

  async queueNotification(jobData: SendNotificationJob): Promise<void> {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    if (!isProduction || !this.notificationQueue) {
      this.logger.log(
        `[NotificationQueueService] DEV mode - skipping queue for ${jobData.channel} notification`,
      );
      await this.notificationLogsService.logQueued(
        jobData.organisationId,
        jobData.userId || '',
        jobData.shipmentId || '',
        jobData.channel,
        jobData.titleKey,
        jobData.data,
      );
      return;
    }

    await this.notificationQueue.add('send-notification', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    });

    await this.notificationLogsService.logQueued(
      jobData.organisationId,
      jobData.userId || '',
      jobData.shipmentId || '',
      jobData.channel,
      jobData.titleKey,
      jobData.data,
    );

    this.logger.log(
      `[NotificationQueueService] Queued ${jobData.channel} notification`,
    );
  }

  async queueShipmentNotification(
    organisationId: string,
    userId: string,
    shipmentId: string,
    channel: 'email' | 'whatsapp',
    titleKey: string,
    data: Record<string, any>,
  ): Promise<void> {
    const jobData: SendNotificationJob = {
      organisationId,
      userId,
      shipmentId,
      channel,
      titleKey,
      data,
    };

    await this.queueNotification(jobData);
  }
}
