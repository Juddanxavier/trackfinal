import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as React from 'react';
import { MSG91Service } from './msg91.service';
import { EmailService } from '../auth/email.service';
import { NotificationLogsService } from './notification-logs.service';
import { InAppChannel } from './channels/in-app.channel';
import { getTemplate, parseTemplate } from './notification-templates';
import { render } from '../email/templates/render';
import { ShipmentNotification } from '../email/templates/ShipmentNotification';

export interface SendNotificationJob {
  organisationId: string;
  userId?: string;
  shipmentId?: string;
  channel: 'email' | 'whatsapp' | 'in_app';
  titleKey: string;
  data: Record<string, any>;
  to?: string;
  phone?: string;
}

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private msg91: MSG91Service,
    private emailService: EmailService,
    private logs: NotificationLogsService,
    private inApp: InAppChannel,
  ) {
    super();
  }

  async process(job: Job<SendNotificationJob>): Promise<any> {
    const {
      organisationId,
      userId,
      shipmentId,
      channel,
      titleKey,
      data,
      to,
      phone,
    } = job.data;
    const status = titleKey.replace('.', '_');
    this.logger.log(`Processing ${channel} for ${to || phone}`);

    try {
      if (channel === 'email') {
        return await this.sendEmail(
          organisationId,
          userId || '',
          shipmentId || '',
          titleKey,
          data,
          to || '',
          status,
        );
      } else if (channel === 'whatsapp') {
        return await this.sendWhatsApp(
          organisationId,
          userId || '',
          shipmentId || '',
          titleKey,
          data,
          phone || '',
          status,
        );
      } else if (channel === 'in_app') {
        return await this.sendInApp(
          organisationId,
          userId || '',
          shipmentId || '',
          titleKey,
          data,
        );
      }
    } catch (error) {
      this.logger.error(`Failed: ${error}`);
      throw error;
    }
  }

  private async sendEmail(
    orgId: string,
    userId: string,
    shipId: string,
    titleKey: string,
    data: Record<string, any>,
    to: string,
    status: string,
  ) {
    let success = false;
    let errorMsg: string | undefined;

    try {
      const template = getTemplate(titleKey);
      const subject = template
        ? parseTemplate(template.subject, data)
        : `Shipment Update: ${titleKey}`;

      const html = await render(
        React.createElement(ShipmentNotification, {
          titleKey,
          ...data,
        }),
      );

      await this.emailService.sendEmail({
        to,
        subject,
        html,
      });
      success = true;
    } catch (err: any) {
      errorMsg = err.message;
      this.logger.error(`Email failed: ${errorMsg}`);
    }

    if (success) {
      await this.logs.logSuccess(
        orgId,
        userId,
        shipId,
        'email',
        titleKey,
        data,
      );
      return { sent: true, channel: 'email' };
    }
    await this.logs.logFailure(
      orgId,
      userId,
      shipId,
      'email',
      titleKey,
      data,
      errorMsg || 'Unknown',
    );
    return { sent: false, channel: 'email', error: errorMsg };
  }

  private async sendWhatsApp(
    orgId: string,
    userId: string,
    shipId: string,
    titleKey: string,
    data: Record<string, any>,
    phone: string,
    status: string,
  ) {
    const result = await this.msg91.sendWhatsApp(phone, status, data);
    if (result.success) {
      await this.logs.logSuccess(
        orgId,
        userId,
        shipId,
        'whatsapp',
        titleKey,
        data,
      );
      return { sent: true, channel: 'whatsapp' };
    }
    await this.logs.logFailure(
      orgId,
      userId,
      shipId,
      'whatsapp',
      titleKey,
      data,
      result.error || 'Unknown',
    );
    return { sent: false, channel: 'whatsapp', error: result.error };
  }

  private async sendInApp(
    orgId: string,
    userId: string,
    shipId: string,
    titleKey: string,
    data: Record<string, any>,
  ) {
    return await this.inApp.send({
      organisationId: orgId,
      userId,
      titleKey,
      data,
      shipmentId: shipId,
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} done`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
