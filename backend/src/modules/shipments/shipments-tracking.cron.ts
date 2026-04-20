import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { db } from '../../database';
import { shipments } from '../../database/schema/shipments';
import { eq, and, inArray } from 'drizzle-orm';
import { Track17Service } from './track17.service';

@Injectable()
export class ShipmentsTrackingCron {
  constructor(private track17Service: Track17Service) {}

  @Cron(CronExpression.EVERY_HOUR)
  async refreshActiveShipments() {
    console.log('[Cron] Refreshing tracking for active shipments...');

    try {
      const activeShipments = await db
        .select()
        .from(shipments)
        .where(
          and(
            eq(shipments.status, 'pending'),
          )
        );

      if (activeShipments.length === 0) {
        console.log('[Cron] No active shipments to refresh');
        return;
      }

      console.log(`[Cron] Refreshing ${activeShipments.length} shipments`);

      for (const shipment of activeShipments) {
        try {
          const trackData = await this.track17Service.track(
            shipment.carrierCode,
            shipment.trackingNumber,
          );

          if (trackData) {
            await db.update(shipments).set({
              track17Data: trackData,
              updatedAt: new Date(),
            } as any).where(eq(shipments.id, shipment.id));
          }
        } catch (error) {
          console.error(`[Cron] Failed to refresh shipment ${shipment.id}:`, error);
        }
      }

      console.log('[Cron] Completed refreshing shipments');
    } catch (error) {
      console.error('[Cron] Error in shipment tracking refresh:', error);
    }
  }
}