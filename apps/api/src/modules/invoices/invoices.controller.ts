import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Res,
  Logger,
  HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CasbinGuard } from '../../common/casbin/casbin.guard';
import { Require } from '../../common/casbin/permissions.decorator';
import { ShipmentsService } from '../shipments/shipments.service';
import { InvoicesService } from './invoices.service';
import { db } from '../../database';
import { organisations } from '../../database/schema/organisations';
import { branches } from '../../database/schema/branches';
import { eq } from 'drizzle-orm';

@ApiTags('invoices')
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name);

  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly invoicesService: InvoicesService,
    @InjectQueue('invoice-emails')
    private readonly invoiceEmailQueue: Queue,
  ) {}

  @Get(':id/download')
  @Public()
  @ApiOperation({ summary: 'Download invoice PDF for a shipment' })
  async download(@Param('id') id: string, @Res() res: Response) {
    try {
      const shipment = await this.shipmentsService.findOne(id);

      if (!shipment) {
        res.status(404).json({ message: 'Shipment not found' });
        return;
      }

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

      this.logger.log(
        `Generating invoice for shipment ${id} (${shipment.trackingNumber})`,
      );

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

      this.logger.log(`PDF generated: ${pdf.length} bytes`);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${shipment.trackingNumber}.pdf"`,
        'Content-Length': pdf.length,
      });
      res.end(pdf);
    } catch (err) {
      this.logger.error(
        `Invoice generation failed: ${(err as Error).message}`,
        (err as Error).stack,
      );
      res.status(500).json({ message: 'Failed to generate invoice' });
    }
  }

  @Post(':id/send-email')
  @UseGuards(CasbinGuard)
  @Require({ resource: 'shipments', action: 'read' })
  @HttpCode(200)
  @ApiOperation({ summary: 'Send invoice PDF via email' })
  async sendEmail(@Param('id') id: string) {
    const shipment = await this.shipmentsService.findOne(id);

    if (!shipment) {
      return { success: false, message: 'Shipment not found' };
    }

    const email = shipment.recipientEmail;
    if (!email) {
      return { success: false, message: 'No recipient email' };
    }

    if (shipment.lastInvoiceEmailSentAt) {
      const lastSent = new Date(shipment.lastInvoiceEmailSentAt).getTime();
      const now = Date.now();
      const msHalfDay = 12 * 60 * 60 * 1000;
      if (now - lastSent < msHalfDay) {
        return {
          success: false,
          message: 'Invoice already sent recently, try again later',
        };
      }
    }

    await this.invoiceEmailQueue.add(
      'send-invoice',
      {
        shipmentId: id,
        trackingNumber: shipment.trackingNumber,
        whiteLabelTrackingCode: shipment.whiteLabelTrackingCode ?? undefined,
        to: email,
        recipientName: shipment.recipientName || 'Customer',
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    );

    this.logger.log(
      `Queued invoice email for ${shipment.trackingNumber} to ${email}`,
    );

    return { success: true, message: 'Invoice email queued' };
  }
}
