import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceEmailProcessor } from './invoice-email.processor';
import { ShipmentsModule } from '../shipments/shipments.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'invoice-emails',
    }),
    ShipmentsModule,
    EmailModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceEmailProcessor],
  exports: [InvoicesService],
})
export class InvoicesModule {}
