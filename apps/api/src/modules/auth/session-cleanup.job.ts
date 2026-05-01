import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SessionsService } from '../users/services';

@Injectable()
export class SessionCleanupJob {
  private readonly logger = new Logger(SessionCleanupJob.name);

  constructor(
    private sessionsService: SessionsService,
    private configService: ConfigService,
  ) {}

  @Cron(process.env.SESSION_CLEANUP_CRON || '0 0 * * 0')
  async handleCron() {
    try {
      const deleted = await this.sessionsService.cleanupExpiredSessions();
      if (deleted > 0) {
        this.logger.log(
          `[SessionCleanup] Removed ${deleted} expired/revoked sessions`,
        );
      }
    } catch (error) {
      this.logger.error('[SessionCleanup] Failed to cleanup sessions', error);
    }
  }
}
