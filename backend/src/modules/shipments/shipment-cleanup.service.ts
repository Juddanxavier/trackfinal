import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { db } from '../../database';
import { shipments } from '../../database/schema/shipments';
import { lt, eq, and, isNotNull } from 'drizzle-orm';

const DEFAULT_ARCHIVE_THRESHOLD_DAYS = 45;
const DEFAULT_ARCHIVE_RETENTION_DAYS = 730;
const DEFAULT_CANCELLED_RETENTION_DAYS = 30;
const DEFAULT_CLEANUP_CRON = '0 0 * * *';

@Injectable()
export class ShipmentCleanupService implements OnModuleInit {
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  onModuleInit() {
    const archiveThreshold = parseInt(
      process.env.SHIPMENT_ARCHIVE_THRESHOLD_DAYS ||
        String(DEFAULT_ARCHIVE_THRESHOLD_DAYS),
    );
    const archiveRetention = parseInt(
      process.env.SHIPMENT_ARCHIVE_RETENTION_DAYS ||
        String(DEFAULT_ARCHIVE_RETENTION_DAYS),
    );
    const cancelledRetention = parseInt(
      process.env.SHIPMENT_CANCELLED_RETENTION_DAYS ||
        String(DEFAULT_CANCELLED_RETENTION_DAYS),
    );
    const cronExpression =
      process.env.SHIPMENT_CLEANUP_CRON || DEFAULT_CLEANUP_CRON;

    const job = new CronJob(cronExpression, () => {
      this.handleCleanup(
        archiveThreshold,
        archiveRetention,
        cancelledRetention,
      );
    });

    this.schedulerRegistry.addCronJob('shipment-cleanup', job);
    job.start();

    console.log(`[ShipmentCleanup] Scheduled: ${cronExpression}`);
    console.log(
      `[ShipmentCleanup] Archive threshold: ${archiveThreshold} days`,
    );
    console.log(
      `[ShipmentCleanup] Archive retention: ${archiveRetention} days`,
    );
    console.log(
      `[ShipmentCleanup] Cancelled retention: ${cancelledRetention} days`,
    );
  }

  private async handleCleanup(
    archiveThreshold: number,
    archiveRetention: number,
    cancelledRetention: number,
  ) {
    console.log('[ShipmentCleanup] Running cleanup...');

    try {
      await this.archiveDeliveredShipments(archiveThreshold);
      await this.purgeCancelledShipments(cancelledRetention);
      await this.purgeArchivedShipments(archiveRetention);
    } catch (error) {
      console.error('[ShipmentCleanup] Error:', error);
    }
  }

  private async archiveDeliveredShipments(thresholdDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

    const result = await db
      .update(shipments)
      .set({
        status: 'archived',
        archivedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(
        and(
          eq(shipments.status, 'delivered'),
          isNotNull(shipments.deliveredAt),
          lt(shipments.deliveredAt, cutoffDate),
        ),
      )
      .returning({ id: shipments.id });

    console.log(
      `[ShipmentCleanup] Archived ${result.length} delivered shipments older than ${thresholdDays} days`,
    );
  }

  private async purgeCancelledShipments(retentionDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db
      .delete(shipments)
      .where(
        and(
          eq(shipments.status, 'cancelled'),
          isNotNull(shipments.deletedAt),
          lt(shipments.deletedAt, cutoffDate),
        ),
      )
      .returning({ id: shipments.id });

    console.log(
      `[ShipmentCleanup] Permanently deleted ${result.length} cancelled shipments older than ${retentionDays} days`,
    );
  }

  private async purgeArchivedShipments(retentionDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await db
      .delete(shipments)
      .where(
        and(
          eq(shipments.status, 'archived'),
          isNotNull(shipments.archivedAt),
          lt(shipments.archivedAt, cutoffDate),
        ),
      )
      .returning({ id: shipments.id });

    console.log(
      `[ShipmentCleanup] Permanently deleted ${result.length} archived shipments older than ${retentionDays} days`,
    );
  }
}
