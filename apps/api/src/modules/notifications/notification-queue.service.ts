import { Injectable, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SendNotificationJob } from './notification-processor';
import { NotificationLogsService } from './notification-logs.service';

const isProduction = process.env.NODE_ENV === 'production';

@Injectable()
export class NotificationQueueService {
  constructor(
    @Optional()
    @InjectQueue('notifications')
    private notificationQueue: Queue | undefined,
    private notificationLogsService: NotificationLogsService,
  ) {}

  async queueNotification(jobData: SendNotificationJob): Promise<void> {
    if (!isProduction || !this.notificationQueue) {
      console.log(
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

    console.log(
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
