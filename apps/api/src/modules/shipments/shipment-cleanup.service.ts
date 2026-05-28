import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { db } from '../../database';
import { shipments } from '../../database/schema/shipments';
import { lt, eq, and, isNull, isNotNull } from 'drizzle-orm';

@Injectable()
export class ShipmentCleanupService implements OnModuleInit {
  private readonly logger = new Logger(ShipmentCleanupService.name);

  constructor(private schedulerRegistry: SchedulerRegistry) {}

  onModuleInit() {
    const cronExpression = process.env.SHIPMENT_RETENTION_CRON || '0 0 * * *';

    const job = new CronJob(cronExpression, () => {
      this.handleRetentionCleanup();
    });

    this.schedulerRegistry.addCronJob('shipment-retention-cleanup', job);
    job.start();

    this.logger.log(`[ShipmentCleanup] Scheduled: ${cronExpression}`);
  }

  private async handleRetentionCleanup() {
    this.logger.log('Running shipment retention policy...');
    const now = new Date();

    const archiveDays = parseInt(process.env.SHIPMENT_ARCHIVE_DAYS || '60');
    const deleteDays = parseInt(process.env.SHIPMENT_DELETE_DAYS || '730');

    const archiveCutoff = new Date(now);
    archiveCutoff.setDate(archiveCutoff.getDate() - archiveDays);

    const deleteCutoff = new Date(now);
    deleteCutoff.setDate(deleteCutoff.getDate() - deleteDays);

    try {
      // Archive delivered shipments older than archiveDays
      const toArchive = await db
        .update(shipments)
        .set({ archivedAt: now })
        .where(
          and(
            eq(shipments.status, 'delivered'),
            isNull(shipments.archivedAt),
            lt(shipments.updatedAt, archiveCutoff),
          ),
        )
        .returning();

      this.logger.log(
        `[ShipmentCleanup] Archived ${toArchive.length} delivered shipments (>${archiveDays}d)`,
      );

      // Permanently delete archived shipments older than deleteDays
      const toDelete = await db
        .delete(shipments)
        .where(
          and(
            isNotNull(shipments.archivedAt),
            lt(shipments.archivedAt, deleteCutoff),
          ),
        )
        .returning();

      this.logger.log(
        `[ShipmentCleanup] Permanently deleted ${toDelete.length} archived shipments (>${deleteDays}d since archive)`,
      );
    } catch (error) {
      this.logger.error('[ShipmentCleanup] Error:', error);
    }
  }
}
