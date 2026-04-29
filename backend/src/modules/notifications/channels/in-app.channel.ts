import { Injectable } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
} from './notification.channel';
import { NotificationsService } from '../notifications.service';
import { CreateNotificationDto } from '../dto';

@Injectable()
export class InAppChannel implements NotificationChannel {
  readonly channelName = 'in_app';

  constructor(private notificationsService: NotificationsService) {}

  canSend(payload: NotificationPayload): boolean {
    return !!payload.userId;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.canSend(payload)) {
      return { success: false, channel: this.channelName, error: 'No userId' };
    }

    try {
      const dto: CreateNotificationDto = {
        userId: payload.userId!,
        titleKey: payload.titleKey,
        data: payload.data,
      };

      const notification = await this.notificationsService.create(
        payload.organisationId,
        dto,
      );

      return {
        success: true,
        channel: this.channelName,
        messageId: notification.id,
      };
    } catch (error) {
      return {
        success: false,
        channel: this.channelName,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create in-app notification',
      };
    }
  }
}
