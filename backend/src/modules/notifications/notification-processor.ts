import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from '../auth/email.service';
import { WhatsAppService } from './whatsapp.service';
import { NotificationLogsService } from './notification-logs.service';

export interface SendNotificationJob {
  organisationId: string;
  userId: string;
  shipmentId: string;
  channel: 'email' | 'whatsapp';
  titleKey: string;
  data: Record<string, any>;
}

@Injectable()
@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  constructor(
    private emailService: EmailService,
    private whatsAppService: WhatsAppService,
    private notificationLogsService: NotificationLogsService,
  ) {
    super();
  }

  async process(job: Job<SendNotificationJob>): Promise<any> {
    const { organisationId, userId, shipmentId, channel, titleKey, data } =
      job.data;

    console.log(
      `[NotificationProcessor] Processing job ${job.id}: ${channel} notification for user ${userId}`,
    );

    try {
      if (channel === 'email') {
        return await this.sendEmailNotification(
          organisationId,
          userId,
          shipmentId,
          titleKey,
          data,
        );
      } else if (channel === 'whatsapp') {
        return await this.sendWhatsAppNotification(
          organisationId,
          userId,
          shipmentId,
          titleKey,
          data,
        );
      }
    } catch (error) {
      console.error(
        `[NotificationProcessor] Failed to send ${channel} notification:`,
        error,
      );
      throw error;
    }
  }

  private async sendEmailNotification(
    organisationId: string,
    userId: string,
    shipmentId: string,
    titleKey: string,
    data: Record<string, any>,
  ): Promise<any> {
    const emailContent = this.buildEmailContent(titleKey, data);

    await this.emailService.sendEmail({
      to: data.email as string,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    await this.notificationLogsService.logSuccess(
      organisationId,
      userId,
      shipmentId,
      'email',
      titleKey,
      data,
    );

    return { sent: true, channel: 'email' };
  }

  private async sendWhatsAppNotification(
    organisationId: string,
    userId: string,
    shipmentId: string,
    titleKey: string,
    data: Record<string, any>,
  ): Promise<any> {
    const phone = data.phone as string;
    const templateData = this.buildWhatsAppTemplateData(titleKey, data);

    const result = await this.whatsAppService.sendTemplate(phone, templateData);

    if (result.success) {
      await this.notificationLogsService.logSuccess(
        organisationId,
        userId,
        shipmentId,
        'whatsapp',
        titleKey,
        data,
      );
    } else {
      await this.notificationLogsService.logFailure(
        organisationId,
        userId,
        shipmentId,
        'whatsapp',
        titleKey,
        data,
        result.error || 'Unknown error',
      );
    }

    return result;
  }

  private buildEmailContent(
    titleKey: string,
    data: Record<string, any>,
  ): { subject: string; html: string } {
    const trackingNumber = String(data.trackingNumber || 'N/A');
    const carrierCode = String(data.carrierCode || 'N/A');
    const whiteLabelCode = String(
      data.whiteLabelCode || data.trackingNumber || '',
    );
    const shipmentLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/track/${whiteLabelCode}`;
    const status = String(data.status || '');
    const location = data.location ? String(data.location) : null;
    const deliveredAt = data.deliveredAt
      ? String(data.deliveredAt)
      : new Date().toLocaleDateString();

    switch (titleKey) {
      case 'shipment.created':
        return {
          subject: `Your shipment ${trackingNumber} has been created`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Shipment Created</h1>
              <p>Your shipment has been created and is ready for tracking.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
                <p><strong>Carrier:</strong> ${carrierCode}</p>
              </div>
              <a href="${shipmentLink}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">Track Your Shipment</a>
            </div>
          `,
        };
      case 'shipment.in_transit':
        return {
          subject: `Your shipment ${trackingNumber} is in transit`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Shipment In Transit</h1>
              <p>Your shipment is now in transit.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
                <p><strong>Status:</strong> ${status || 'In Transit'}</p>
                ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
              </div>
              <a href="${shipmentLink}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">Track Your Shipment</a>
            </div>
          `,
        };
      case 'shipment.delivered':
        return {
          subject: `Your shipment ${trackingNumber} has been delivered`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #28a745;">Shipment Delivered</h1>
              <p>Great news! Your shipment has been delivered.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
                <p><strong>Delivered:</strong> ${deliveredAt}</p>
              </div>
              <a href="${shipmentLink}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">View Delivery Details</a>
            </div>
          `,
        };
      default:
        return {
          subject: `Shipment Update: ${trackingNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Shipment Update</h1>
              <p>There is an update on your shipment.</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
              </div>
              <a href="${shipmentLink}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">Track Your Shipment</a>
            </div>
          `,
        };
    }
  }

  private buildWhatsAppTemplateData(
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

    const statusLabel = titleKey === 'shipment.created' ? 'Created' :
                        titleKey === 'shipment.in_transit' ? 'In Transit' :
                        titleKey === 'shipment.delivered' ? 'Delivered' : 'Update';
    const name = getStr('recipientName') || 'Customer';
    const whiteLabelCode = getStr('whiteLabelCode') || getStr('trackingNumber') || '';
    const destination = getStr('destinationCountry') || getStr('location') || 'Unknown';
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

  @OnWorkerEvent('failed')
  handleFailedJob(job: Job<SendNotificationJob>, error: Error) {
    console.error(
      `[NotificationProcessor] Job ${job.id} failed:`,
      error.message,
    );
  }
}
