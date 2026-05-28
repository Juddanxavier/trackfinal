import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { db } from '../../database';
import { quotes } from '../../database/schema/quotes';
import { notifications } from '../../database/schema/notifications';
import { lt, eq, and, isNull, isNotNull, or, lt as ltRef } from 'drizzle-orm';

const RETENTION_CRON = '0 0 * * *';

@Injectable()
export class QuoteCleanupService implements OnModuleInit {
  private readonly logger = new Logger(QuoteCleanupService.name);
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  onModuleInit() {
    const cronExpression = process.env.QUOTE_RETENTION_CRON || RETENTION_CRON;

    const job = new CronJob(cronExpression, () => {
      this.handleRetentionCleanup();
    });

    this.schedulerRegistry.addCronJob('quote-retention-cleanup', job);
    job.start();

    this.logger.log(`[QuoteCleanup] Scheduled: ${cronExpression}`);
  }

  private async handleRetentionCleanup() {
    this.logger.log('[QuoteCleanup] Running retention policy...');
    const now = new Date();

    const rejectedDays = parseInt(
      process.env.QUOTE_RETENTION_REJECTED_DAYS || '30',
    );
    const pendingDays = parseInt(
      process.env.QUOTE_RETENTION_PENDING_DAYS || '45',
    );
    const acceptedArchiveDays = parseInt(
      process.env.QUOTE_RETENTION_ACCEPTED_ARCHIVE_DAYS || '30',
    );
    const acceptedDeleteDays = parseInt(
      process.env.QUOTE_RETENTION_ACCEPTED_DELETE_DAYS || '365',
    );

    try {
      const rejectedCutoff = new Date(now);
      rejectedCutoff.setDate(rejectedCutoff.getDate() - rejectedDays);

      const pendingCutoff = new Date(now);
      pendingCutoff.setDate(pendingCutoff.getDate() - pendingDays);

      const acceptedArchiveCutoff = new Date(now);
      acceptedArchiveCutoff.setDate(
        acceptedArchiveCutoff.getDate() - acceptedArchiveDays,
      );

      const acceptedDeleteCutoff = new Date(now);
      acceptedDeleteCutoff.setDate(
        acceptedDeleteCutoff.getDate() - acceptedDeleteDays,
      );

      const rejectedDeleted = await db
        .delete(quotes)
        .where(
          and(
            eq(quotes.status, 'rejected'),
            isNull(quotes.deletedAt),
            lt(quotes.updatedAt, rejectedCutoff),
          ),
        )
        .returning();

      const pendingDeleted = await db
        .delete(quotes)
        .where(
          and(
            eq(quotes.status, 'pending'),
            isNull(quotes.deletedAt),
            lt(quotes.updatedAt, pendingCutoff),
          ),
        )
        .returning();

      const quotedDeleted = await db
        .delete(quotes)
        .where(
          and(
            eq(quotes.status, 'quoted'),
            isNull(quotes.deletedAt),
            lt(quotes.updatedAt, pendingCutoff),
          ),
        )
        .returning();

      this.logger.log(
        `[QuoteCleanup] Deleted ${rejectedDeleted.length} rejected (>${rejectedDays}d), ${pendingDeleted.length} pending (>${pendingDays}d), ${quotedDeleted.length} quoted (>${pendingDays}d)`,
      );

      const acceptedToArchive = await db
        .update(quotes)
        .set({ archivedAt: now })
        .where(
          and(
            eq(quotes.status, 'accepted'),
            isNull(quotes.archivedAt),
            lt(quotes.updatedAt, acceptedArchiveCutoff),
          ),
        )
        .returning();

      this.logger.log(
        `[QuoteCleanup] Archived ${acceptedToArchive.length} accepted (>${acceptedArchiveDays}d)`,
      );

      const acceptedToDelete = await db
        .delete(quotes)
        .where(
          and(
            eq(quotes.status, 'accepted'),
            isNotNull(quotes.archivedAt),
            lt(quotes.archivedAt, acceptedDeleteCutoff),
          ),
        )
        .returning();

      for (const q of acceptedToDelete) {
        await db
          .delete(notifications)
          .where(eq(notifications.titleKey, 'quote.assigned'));
      }

      this.logger.log(
        `[QuoteCleanup] Permanently deleted ${acceptedToDelete.length} accepted (>${acceptedDeleteDays}d since archive)`,
      );
    } catch (error) {
      this.logger.error('[QuoteCleanup] Error:', error);
    }
  }
}
