import { Injectable } from '@nestjs/common';
import { EmailOptions } from '../auth/email.service';
import { EmailService } from '../auth/email.service';

@Injectable()
export class EmailQueueService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async addEmailJob(options: EmailOptions): Promise<void> {
    await this.emailService.sendEmail(options);
  }
}
