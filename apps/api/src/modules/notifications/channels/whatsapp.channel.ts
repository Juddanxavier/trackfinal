import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
} from './notification.channel';
import { getTemplate, parseTemplate } from '../notification-templates';

const USE_QUEUE = process.env.NOTIFICATION_USE_QUEUE !== 'false';

@Injectable()
export class WhatsAppChannel implements NotificationChannel {
  readonly channelName = 'whatsapp';

  constructor(
    @InjectQueue('notifications')
    private notificationQueue: Queue,
  ) {}

  canSend(payload: NotificationPayload): boolean {
    return !!payload.recipientPhone;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.canSend(payload)) {
      return {
        success: false,
        channel: this.channelName,
        error: 'No recipient phone',
      };
    }

    const template = getTemplate(payload.titleKey);
    const message = template?.whatsappTemplate
      ? parseTemplate(template.whatsappTemplate, payload.data || {})
      : template?.smsTemplate
        ? parseTemplate(template.smsTemplate, payload.data || {})
        : JSON.stringify(payload.data);

    if (!USE_QUEUE || !this.notificationQueue) {
      console.log(
        '[WhatsAppChannel DEV] Would send WhatsApp:',
        message,
        'to',
        payload.recipientPhone,
      );
      return {
        success: true,
        channel: this.channelName,
        messageId: 'dev-' + Date.now(),
      };
    }

    try {
      await this.notificationQueue.add('send-whatsapp', {
        channel: 'whatsapp',
        phone: payload.recipientPhone,
        message,
        data: payload.data,
        organisationId: payload.organisationId,
        userId: payload.userId,
        titleKey: payload.titleKey,
        shipmentId: payload.shipmentId,
      });

      return {
        success: true,
        channel: this.channelName,
        messageId: 'queued-' + Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        channel: this.channelName,
        error:
          error instanceof Error ? error.message : 'Failed to queue WhatsApp',
      };
    }
  }
}
