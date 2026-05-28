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
export class EmailChannel implements NotificationChannel {
  readonly channelName = 'email';

  constructor(
    @InjectQueue('notifications')
    private notificationQueue: Queue,
  ) {}

  canSend(payload: NotificationPayload): boolean {
    return !!payload.recipientEmail;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.canSend(payload)) {
      return {
        success: false,
        channel: this.channelName,
        error: 'No recipient email',
      };
    }

    const template = getTemplate(payload.titleKey);
    const subject = template
      ? parseTemplate(template.subject, payload.data || {})
      : `Shipment Update: ${payload.titleKey}`;
    const body = template
      ? parseTemplate(template.body, payload.data || {})
      : JSON.stringify(payload.data);

    if (!USE_QUEUE || !this.notificationQueue) {
      console.log(
        '[EmailChannel DEV] Would send email:',
        subject,
        'to',
        payload.recipientEmail,
      );
      return {
        success: true,
        channel: this.channelName,
        messageId: 'dev-' + Date.now(),
      };
    }

    try {
      await this.notificationQueue.add('send-email', {
        channel: 'email',
        to: payload.recipientEmail,
        subject,
        body,
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
        error: error instanceof Error ? error.message : 'Failed to queue email',
      };
    }
  }
}
