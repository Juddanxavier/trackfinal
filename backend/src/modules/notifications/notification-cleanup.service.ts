import { Injectable, OnModuleInit } from '@nestjs/common';
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
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  onModuleInit() {
    const period = (process.env.NOTIFICATION_CLEANUP_PERIOD || 'weekly') as CleanupPeriod;
    const cronExpression = process.env.NOTIFICATION_CLEANUP_CRON || CRON_MAP[period] || CRON_MAP.weekly;

    const job = new CronJob(cronExpression, () => {
      this.handleExpiredNotifications();
    });

    this.schedulerRegistry.addCronJob('notification-cleanup', job);
    job.start();

    console.log(`[NotificationCleanup] Scheduled: ${period} (${cronExpression})`);
  }

  private async handleExpiredNotifications() {
    console.log(`[NotificationCleanup] Running cleanup...`);

    try {
      await db
        .delete(notifications)
        .where(lt(notifications.expiresAt, new Date()));

      console.log(`[NotificationCleanup] Deleted expired notifications`);
    } catch (error) {
      console.error('[NotificationCleanup] Error:', error);
    }
  }
}
