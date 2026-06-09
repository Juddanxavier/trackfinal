import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from '../auth/email.service';
import { InvoicesService } from './invoices.service';
import { ShipmentsService } from '../shipments/shipments.service';
import { db } from '../../database';
import { organisations } from '../../database/schema/organisations';
import { branches } from '../../database/schema/branches';
import { shipments } from '../../database/schema/shipments';
import { eq } from 'drizzle-orm';

export interface InvoiceEmailJob {
  shipmentId: string;
  trackingNumber: string;
  whiteLabelTrackingCode?: string;
  to: string;
  recipientName: string;
}

@Processor('invoice-emails')
export class InvoiceEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceEmailProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly invoicesService: InvoicesService,
    private readonly shipmentsService: ShipmentsService,
  ) {
    super();
  }

  async process(job: Job<InvoiceEmailJob>): Promise<any> {
    const {
      shipmentId,
      trackingNumber,
      whiteLabelTrackingCode,
      to,
      recipientName,
    } = job.data;

    this.logger.log(`Generating invoice PDF for ${trackingNumber}`);

    try {
      const shipment = await this.shipmentsService.findOne(shipmentId);
      if (!shipment) throw new Error(`Shipment ${shipmentId} not found`);

      let orgName = 'GT Express';
      let orgAddress = '';
      let orgEmail = '';
      let orgPhone = '';
      let branchName = '';

      if (shipment.organisationId) {
        const [org] = await db
          .select()
          .from(organisations)
          .where(eq(organisations.id, shipment.organisationId));
        if (org) {
          orgName = org.name || orgName;
          const parts = [
            org.address,
            org.city,
            org.state,
            org.postalCode,
          ].filter(Boolean);
          orgAddress = parts.join(', ');
          orgEmail = org.email || '';
          orgPhone = org.phone || '';
        }
      }

      if (shipment.branchId) {
        const [branch] = await db
          .select()
          .from(branches)
          .where(eq(branches.id, shipment.branchId));
        if (branch) {
          branchName = branch.name || '';
          if (branch.address) {
            const parts = [
              branch.address,
              branch.city,
              branch.state,
              branch.postalCode,
            ].filter(Boolean);
            orgAddress = parts.join(', ');
          }
          orgEmail = branch.email || orgEmail;
          orgPhone = branch.phone || orgPhone;
        }
      }

      const pdf = await this.invoicesService.generateShipmentInvoice({
        trackingNumber: shipment.trackingNumber,
        whiteLabelTrackingCode: shipment.whiteLabelTrackingCode ?? undefined,
        recipientName: shipment.recipientName || '',
        recipientEmail: shipment.recipientEmail ?? undefined,
        recipientPhone: shipment.recipientPhone ?? undefined,
        recipientAddress: shipment.recipientAddress ?? undefined,
        originCountry: shipment.originCountry ?? undefined,
        destinationCountry: shipment.destinationCountry ?? undefined,
        status: shipment.status,
        billAmount: shipment.billAmount ?? undefined,
        createdAt: shipment.createdAt,
        deliveredAt: shipment.deliveredAt ?? undefined,
        orgName,
        orgAddress,
        orgEmail,
        orgPhone,
        branchName,
      });

      this.logger.log(`Sending invoice email for ${trackingNumber} to ${to}`);

      const displayCode = whiteLabelTrackingCode || trackingNumber;
      const apiBaseUrl = process.env.API_URL || 'http://localhost:4000/api';
      const downloadUrl = `${apiBaseUrl}/invoices/${shipmentId}/download`;

      await this.emailService.sendEmail({
        to,
        subject: `Invoice for Shipment ${displayCode}`,
        html: this.buildEmailHtml(recipientName, displayCode, downloadUrl),
        attachments: [
          {
            filename: `invoice-${trackingNumber}.pdf`,
            content: pdf,
            contentType: 'application/pdf',
          },
        ],
      });

      await db
        .update(shipments)
        .set({ lastInvoiceEmailSentAt: new Date() })
        .where(eq(shipments.id, shipmentId));

      this.logger.log(`Invoice email sent for ${trackingNumber}`);
      return { sent: true, trackingNumber };
    } catch (error) {
      this.logger.error(
        `Failed to send invoice email: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private buildEmailHtml(
    name: string,
    code: string,
    downloadUrl: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:#0f172a;padding:40px 32px;text-align:center;">
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;">Invoice Ready</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">Hi ${name},</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">Your invoice is ready. Click below to download.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600;">Reference</p>
            <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">${code}</p>
          </div>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
            <tr><td style="background:#0f172a;border-radius:8px;padding:14px 32px;">
              <a href="${downloadUrl}" target="_blank" style="display:inline-block;font-size:15px;font-weight:600;color:#fff;text-decoration:none;">Download Invoice</a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:14px;color:#64748b;">Thank you for choosing our services.</p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:13px;color:#94a3b8;">Need help? Contact our support team.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
