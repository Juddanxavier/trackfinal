import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { db } from '../../database';
import { notifications } from '../../database/schema';
import { lt } from 'drizzle-orm';

type CleanupPeriod = 'daily' | 'weekly' | 'monthly';

const CRON_MAP: Record<CleanupPeriod, string> = {
  daily: '0 0 * * *',
  weekly: '0 0 * * 0',
  monthly: '0 0 1 * *',
};

@Injectable()
export class NotificationCleanupService implements OnModuleInit {
  private readonly logger = new Logger(NotificationCleanupService.name);
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  onModuleInit() {
    const period = (process.env.NOTIFICATION_CLEANUP_PERIOD ||
      'weekly') as CleanupPeriod;
    const cronExpression =
      process.env.NOTIFICATION_CLEANUP_CRON ||
      CRON_MAP[period] ||
      CRON_MAP.weekly;

    const job = new CronJob(cronExpression, () => {
      this.handleExpiredNotifications();
    });

    this.schedulerRegistry.addCronJob('notification-cleanup', job);
    job.start();

    this.logger.log(
      `[NotificationCleanup] Scheduled: ${period} (${cronExpression})`,
    );
  }

  private async handleExpiredNotifications() {
    this.logger.log(`[NotificationCleanup] Running cleanup...`);

    try {
      await db
        .delete(notifications)
        .where(lt(notifications.expiresAt, new Date()));

      this.logger.log(`[NotificationCleanup] Deleted expired notifications`);
    } catch (error) {
      this.logger.error('[NotificationCleanup] Error:', error);
    }
  }
}
