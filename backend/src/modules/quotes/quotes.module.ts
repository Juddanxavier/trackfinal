import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { QuoteCleanupService } from './quote-cleanup.service';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [UsersModule, NotificationsModule, AuthModule, EmailModule],
  controllers: [QuotesController],
  providers: [QuotesService, QuoteCleanupService],
  exports: [QuotesService],
})
export class QuotesModule {}
