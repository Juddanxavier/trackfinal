import { Module } from '@nestjs/common';
import { EmailQueueService } from './email-queue.service';
import { EmailService } from '../auth/email.service';

@Module({
  providers: [EmailQueueService, EmailService],
  exports: [EmailQueueService, EmailService],
})
export class EmailModule {}