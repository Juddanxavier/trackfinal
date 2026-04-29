import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
} from './notification.channel';
import { WhatsAppService } from '../whatsapp.service';

const USE_QUEUE = process.env.NOTIFICATION_USE_QUEUE !== 'false';

@Injectable()
export class WhatsAppChannel implements NotificationChannel {
  readonly channelName = 'whatsapp';

  constructor(
    private whatsAppService: WhatsAppService,
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

    const templateData = this.buildTemplateData(payload.titleKey, payload.data);

    if (!USE_QUEUE || !this.notificationQueue) {
      console.log(
        '[WhatsAppChannel DEV] Would send WhatsApp:',
        templateData.templateName,
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
        templateName: templateData.templateName,
        variables: templateData.variables,
        organisationId: payload.organisationId,
        userId: payload.userId,
        titleKey: payload.titleKey,
        data: payload.data,
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

  private buildTemplateData(
    titleKey: string,
    data: Record<string, any>,
  ): { templateName: string; variables: string[] } {
    const getStr = (key: string): string => {
      const val: unknown = data[key];
      if (typeof val === 'string') return val;
      if (typeof val === 'number') return String(val);
      return '';
    };

    const getOrDefault = (key: string, defaultVal: string): string => {
      const val: unknown = data[key];
      if (typeof val === 'string' && val !== '') return val;
      if (typeof val === 'number') return String(val);
      return defaultVal;
    };

    const statusLabel =
      titleKey === 'shipment.created'
        ? 'Created'
        : titleKey === 'shipment.in_transit'
          ? 'In Transit'
          : titleKey === 'shipment.delivered'
            ? 'Delivered'
            : 'Update';

    const name = getStr('recipientName') || 'Customer';
    const whiteLabelCode =
      getStr('whiteLabelCode') || getStr('trackingNumber') || '';
    const destination = getOrDefault(
      'destinationCountry',
      getStr('location') || 'Unknown',
    );
    const status = getOrDefault('status', statusLabel);

    switch (titleKey) {
      case 'shipment.created':
        return {
          templateName: 'shipment_created',
          variables: [status, name, whiteLabelCode, destination],
        };
      case 'shipment.in_transit':
        return {
          templateName: 'shipment_in_transit',
          variables: [status, name, whiteLabelCode, destination],
        };
      case 'shipment.delivered':
        return {
          templateName: 'shipment_delivered',
          variables: [status, name, whiteLabelCode, destination],
        };
      default:
        return {
          templateName: 'shipment_update',
          variables: [status, name, whiteLabelCode, destination],
        };
    }
  }
}
