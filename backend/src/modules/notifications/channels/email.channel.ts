import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
} from './notification.channel';

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

    const emailContent = this.buildEmailContent(payload.titleKey, payload.data);

    if (!USE_QUEUE || !this.notificationQueue) {
      console.log(
        '[EmailChannel DEV] Would send email:',
        emailContent.subject,
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
        subject: emailContent.subject,
        html: emailContent.html,
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
        error: error instanceof Error ? error.message : 'Failed to queue email',
      };
    }
  }

  private buildEmailContent(
    titleKey: string,
    data: Record<string, any>,
  ): { subject: string; html: string } {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const trackingNumber = String(data.trackingNumber || 'N/A');
    const carrierCode = String(data.carrierCode || 'N/A');
    const whiteLabelCode = String(
      data.whiteLabelCode || data.trackingNumber || '',
    );
    const shipmentLink = `${frontendUrl}/track/${whiteLabelCode}`;
    const unsubscribeUrl = `${frontendUrl}/unsubscribe`;
    const status = String(data.status || '');
    const recipientName = String(data.recipientName || 'Customer');
    const location = data.location ? String(data.location) : null;
    const deliveredAt = data.deliveredAt || new Date().toLocaleDateString();

    switch (titleKey) {
      case 'shipment.created':
        return {
          subject: `Your shipment ${trackingNumber} has been created`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Shipment Created</h1>
              <p>Hello ${recipientName}, your shipment has been created and is ready for tracking.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
                <p><strong>Carrier:</strong> ${carrierCode}</p>
              </div>
              <a href="${shipmentLink}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">Track Your Shipment</a>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> from these emails
              </p>
            </div>
          `,
        };
      case 'shipment.in_transit':
        return {
          subject: `Your shipment ${trackingNumber} is in transit`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Shipment In Transit</h1>
              <p>Hello ${recipientName}, your shipment is now in transit.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
                <p><strong>Status:</strong> ${status}</p>
                ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
              </div>
              <a href="${shipmentLink}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">Track Your Shipment</a>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> from these emails
              </p>
            </div>
          `,
        };
      case 'shipment.delivered':
        return {
          subject: `Your shipment ${trackingNumber} has been delivered`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #28a745;">Delivered!</h1>
              <p>Hello ${recipientName}, great news! Your shipment has been delivered.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
                <p><strong>Delivered:</strong> ${deliveredAt}</p>
              </div>
              <a href="${shipmentLink}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">View Details</a>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> from these emails
              </p>
            </div>
          `,
        };
      default:
        return {
          subject: `Shipment Update: ${trackingNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Shipment Update</h1>
              <p>Hello ${recipientName}, there is an update on your shipment.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
              </div>
              <a href="${shipmentLink}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">Track Your Shipment</a>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> from these emails
              </p>
            </div>
          `,
        };
    }
  }
}
