import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { db } from '../../database';
import { quotes } from '../../database/schema/quotes';
import { notifications } from '../../database/schema/notifications';
import { lt, eq, and, isNotNull } from 'drizzle-orm';

const RETENTION_DAYS = 365;
const RETENTION_CRON = '0 0 1 * *';

@Injectable()
export class QuoteCleanupService implements OnModuleInit {
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  onModuleInit() {
    const cronExpression = process.env.QUOTE_RETENTION_CRON || RETENTION_CRON;

    const job = new CronJob(cronExpression, () => {
      this.handleRetentionCleanup();
    });

    this.schedulerRegistry.addCronJob('quote-retention-cleanup', job);
    job.start();

    console.log(`[QuoteCleanup] Scheduled: ${cronExpression}`);
  }

  private async handleRetentionCleanup() {
    console.log('[QuoteCleanup] Running retention policy...');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

      const deletedQuotes = await db
        .delete(quotes)
        .where(
          and(
            eq(quotes.status, 'deleted'),
            isNotNull(quotes.deletedAt),
            lt(quotes.deletedAt, cutoffDate),
          ),
        )
        .returning();

      for (const q of deletedQuotes) {
        await db
          .delete(notifications)
          .where(eq(notifications.titleKey, 'quote.assigned'));
      }

      console.log(
        `[QuoteCleanup] Permanently deleted ${deletedQuotes.length} quotes older than ${RETENTION_DAYS} days`,
      );
    } catch (error) {
      console.error('[QuoteCleanup] Error:', error);
    }
  }
}
