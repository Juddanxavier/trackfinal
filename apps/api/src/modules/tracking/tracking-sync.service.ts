import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { db } from '../../database';
import { shipments, shipmentEvents } from '../../database/schema/shipments';
import { eq, and, not, inArray, isNull, sql } from 'drizzle-orm';
import { SeventeenTrackService } from './seventeen-track.service';
import { STATUS_MAP, TrackingData } from './tracking-parser.service';
import { NotificationService } from '../notifications/notification.service';
import { WebhooksService, WebhookEvent } from '../webhooks/webhooks.service';

interface WebhookPayload {
  number: string;
  carrier: number;
  tag: string;
  track_info?: {
    shipping_info?: {
      shipper_address?: { country?: string; state?: string; city?: string };
      recipient_address?: { country?: string; state?: string; city?: string };
    };
    latest_status?: { status?: string; sub_status?: string };
    latest_event?: {
      time_utc?: string;
      description?: string;
      location?: string;
      stage?: string;
      address?: { country?: string; state?: string; city?: string };
    };
    tracking?: {
      providers?: Array<{
        provider?: { key: number; name?: string };
        events?: Array<{
          time_utc?: string;
          description?: string;
          location?: string;
          stage?: string;
          sub_status?: string;
          address?: { country?: string; state?: string; city?: string };
        }>;
      }>;
    };
  };
}

@Injectable()
export class TrackingSyncService {
  private readonly logger = new Logger(TrackingSyncService.name);
  private isRunning = false;
  private pollingIntervalMinutes = 60;

  constructor(
    private configService: ConfigService,
    private seventeenTrackService: SeventeenTrackService,
    private notificationService: NotificationService,
    private webhooksService: WebhooksService,
  ) {
    this.pollingIntervalMinutes =
      this.configService.get<number>('TRACKING_POLL_INTERVAL') || 60;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async pollStaleShipments() {
    const settings = await this.seventeenTrackService.getSettings();
    if (settings && !settings.pollingEnabled) {
      this.logger.log('Polling disabled, skipping');
      return;
    }

    await this.syncStaleShipments();
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processQueuedJobs() {
    await this.processRetryQueue();
  }

  async syncStaleShipments() {
    if (this.isRunning) {
      this.logger.log('Sync already running, skipping');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting stale shipment sync...');

    try {
      const staleSince = new Date(
        Date.now() - this.pollingIntervalMinutes * 60 * 1000,
      );

      const staleShipments = await db
        .select()
        .from(shipments)
        .where(
          and(
            isNull(shipments.deletedAt),
            isNull(shipments.archivedAt),
            not(inArray(shipments.status, ['delivered', 'cancelled'])),
            sql`${shipments.updatedAt} < ${staleSince} OR ${shipments.updatedAt} IS NULL`,
          ),
        )
        .limit(500);

      this.logger.log(`Found ${staleShipments.length} stale shipments to sync`);

      let successCount = 0;
      let failCount = 0;

      for (const shipment of staleShipments) {
        try {
          const synced = await this.syncShipment(shipment);
          if (synced) successCount++;
          else failCount++;
        } catch (error) {
          failCount++;
          this.logger.error(
            `Failed to sync ${shipment.trackingNumber}:`,
            error,
          );
        }
      }

      this.logger.log(
        `Stale sync complete: ${successCount} success, ${failCount} failed`,
      );
    } catch (error) {
      this.logger.error('Stale sync failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async processRetryQueue() {
    const pendingJobs = await this.seventeenTrackService.getPendingJobs(50);

    if (pendingJobs.length === 0) return;

    this.logger.log(`Processing ${pendingJobs.length} queued jobs`);

    for (const job of pendingJobs) {
      try {
        await this.seventeenTrackService.processJob(job.id);
      } catch (error) {
        this.logger.error(`Failed to process job ${job.id}:`, error);
      }
    }
  }

  async handleWebhook(payload: WebhookPayload[]) {
    this.logger.log(`[Webhook] Received ${payload.length} updates`);

    for (const item of payload) {
      await this.processWebhookItem(item);
    }

    return { success: true, processed: payload.length };
  }

  private getStatusTitleKey(status: string): string {
    switch (status) {
      case 'delivered':
        return 'shipment.delivered';
      case 'in_transit':
        return 'shipment.in_transit';
      default:
        return `shipment.${status}`;
    }
  }

  private getWebhookEventType(status: string): WebhookEvent | null {
    switch (status) {
      case 'delivered':
        return 'delivered';
      case 'in_transit':
        return 'in_transit';
      case 'exception':
        return 'exception';
      case 'cancelled':
        return 'cancelled';
      default:
        return null;
    }
  }

  private async sendStatusChangeNotification(
    shipment: typeof shipments.$inferSelect,
    status: string,
    location: string | null,
  ) {
    if (
      !shipment.userId &&
      !shipment.recipientEmail &&
      !shipment.recipientPhone
    )
      return;

    try {
      await this.notificationService.sendToAll({
        organisationId: shipment.organisationId,
        userId: shipment.userId || undefined,
        recipientEmail: shipment.recipientEmail || undefined,
        recipientPhone: shipment.recipientPhone || undefined,
        titleKey: this.getStatusTitleKey(status),
        data: {
          trackingNumber: shipment.trackingNumber,
          carrierCode: shipment.carrierCode,
          status,
          recipientName: shipment.recipientName,
          destinationCountry: shipment.destinationCountry,
          whiteLabelCode: shipment.whiteLabelTrackingCode,
          location,
        },
      });
    } catch (err) {
      this.logger.error(`[Webhook] Failed to send notification: ${err}`);
    }
  }

  private async deduplicateAndSaveEvents(
    shipmentId: string,
    events: TrackingData['events'],
    defaultStatus: string,
    defaultStatusRaw: string,
  ) {
    if (!events || events.length === 0) return;

    const existingEvents = await db
      .select()
      .from(shipmentEvents)
      .where(eq(shipmentEvents.shipmentId, shipmentId));

    const existingKeys = new Set(
      existingEvents.map(
        (e) => `${e.eventTime?.getTime()}-${e.description}-${e.location}`,
      ),
    );

    let eventsSaved = 0;
    for (const event of events) {
      const eventTime = event.eventTime
        ? new Date(event.eventTime)
        : new Date();
      const key = `${eventTime.getTime()}-${event.description || ''}-${event.location || ''}`;

      if (existingKeys.has(key)) continue;

      try {
        await db
          .insert(shipmentEvents)
          .values({
            shipmentId,
            status: event.status || defaultStatus,
            statusRaw: event.statusRaw || defaultStatusRaw,
            description: event.description || null,
            location: event.location || null,
            eventTime,
          })
          .onConflictDoNothing();
        eventsSaved++;
      } catch (err) {
        this.logger.error(`Failed to save event: ${err}`);
      }
    }
    this.logger.debug(
      `Saved ${eventsSaved} new events for shipment ${shipmentId}`,
    );
  }

  private async processWebhookItem(item: WebhookPayload) {
    const trackingNumber = item.number;

    if (!item.track_info) {
      this.logger.debug(`[Webhook] No track_info for: ${trackingNumber}`);
      return;
    }

    const latestStatus = item.track_info.latest_status;
    const statusRaw =
      latestStatus?.sub_status || latestStatus?.status || 'unknown';
    const status = this.getStatus(statusRaw);

    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.trackingNumber, trackingNumber));

    if (!shipment) {
      this.logger.debug(`[Webhook] Shipment not found: ${trackingNumber}`);
      return;
    }

    if (shipment.status === status) {
      this.logger.debug(
        `[Webhook] Status unchanged for ${trackingNumber}: ${status}`,
      );
      return;
    }

    await db
      .update(shipments)
      .set({
        status: status as any,
        track17Data: {
          ...(shipment.track17Data || {}),
          lastSync: new Date().toISOString(),
          lastStatus: status,
        },
        deliveredAt: status === 'delivered' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(shipments.id, shipment.id));

    const latestEvent = item.track_info.latest_event;
    if (latestEvent?.time_utc) {
      await db
        .insert(shipmentEvents)
        .values({
          shipmentId: shipment.id,
          status,
          statusRaw,
          description: latestEvent.description || null,
          location: latestEvent.location || null,
          eventTime: new Date(latestEvent.time_utc),
        })
        .onConflictDoNothing();
    }

    this.logger.log(
      `[Webhook] Status changed for ${trackingNumber}: ${shipment.status} -> ${status}`,
    );
    await this.sendStatusChangeNotification(
      shipment,
      status,
      latestEvent?.location || null,
    );

    const webhookEvent = this.getWebhookEventType(status);
    if (webhookEvent) {
      this.webhooksService
        .dispatch(
          webhookEvent,
          {
            trackingNumber: shipment.trackingNumber,
            carrierCode: shipment.carrierCode,
            status,
            statusRaw,
            recipientName: shipment.recipientName,
            destinationCountry: shipment.destinationCountry,
            location: latestEvent?.location || null,
            eventTime: latestEvent?.time_utc || null,
            organisationId: shipment.organisationId,
          },
          shipment.organisationId,
        )
        .catch((err) => {
          this.logger.error(`[Webhook] Failed to dispatch webhook: ${err}`);
        });
    }

    this.logger.log(`[Webhook] Updated shipment ${trackingNumber}: ${status}`);
  }

  private getStatus(subStatus: string): string {
    return STATUS_MAP[subStatus] || 'in_transit';
  }

  async syncShipment(
    shipment: typeof shipments.$inferSelect,
  ): Promise<boolean> {
    this.logger.log(
      `[syncShipment] Starting sync for ${shipment.trackingNumber} (carrier: ${shipment.carrierCode})`,
    );

    const tracking = await this.seventeenTrackService.getTracking(
      shipment.trackingNumber,
      shipment.carrierCode,
    );

    this.logger.log(
      `[syncShipment] Got tracking:`,
      tracking ? `${tracking.status}` : 'null',
    );

    if (!tracking || !tracking.status) {
      this.logger.warn(
        `[syncShipment] No tracking data for ${shipment.trackingNumber}`,
      );
      return false;
    }

    await this.updateShipmentFromTracking(shipment, tracking);
    return true;
  }

  private async updateShipmentFromTracking(
    shipment: typeof shipments.$inferSelect,
    tracking: TrackingData,
  ) {
    const status = tracking.status;
    const statusRaw = tracking.statusRaw;

    this.logger.log(
      `[updateShipmentFromTracking] Updating shipment ${shipment.id} with status: ${status}, events: ${tracking.events?.length || 0}`,
    );

    await db
      .update(shipments)
      .set({
        status: status as any,
        originCountry: tracking.originCountry || shipment.originCountry,
        destinationCountry:
          tracking.destinationCountry || shipment.destinationCountry,
        carrierCode: tracking.carrierCode || shipment.carrierCode,
        track17Data: {
          ...(shipment.track17Data || {}),
          lastSync: new Date().toISOString(),
          originCountry: tracking.originCountry,
          destinationCountry: tracking.destinationCountry,
          lastStatus: status,
        },
        deliveredAt: status === 'delivered' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(shipments.id, shipment.id));

    await this.deduplicateAndSaveEvents(
      shipment.id,
      tracking.events,
      status,
      statusRaw,
    );

    if (shipment.status !== status) {
      this.logger.log(
        `[updateShipmentFromTracking] Status changed for ${shipment.trackingNumber}: ${shipment.status} -> ${status}`,
      );
      await this.sendStatusChangeNotification(shipment, status, null);
    }

    this.logger.log(
      `[updateShipmentFromTracking] Updated shipment ${shipment.trackingNumber}: ${status}`,
    );
  }

  async registerShipment(shipment: typeof shipments.$inferSelect) {
    const result = await this.seventeenTrackService.register(
      shipment.trackingNumber,
      shipment.carrierCode,
      { tag: shipment.trackingNumber },
    );

    if (result.success) {
      await this.syncShipment(shipment);
    }

    return result;
  }

  async triggerManualSync(shipmentId: string) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId));

    if (!shipment) {
      return { success: false, message: 'Shipment not found' };
    }

    try {
      const synced = await this.syncShipment(shipment);
      return {
        success: synced,
        message: synced ? 'Synced successfully' : 'Sync failed',
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async triggerSyncAll() {
    this.logger.log('Manual full sync triggered');

    if (this.isRunning) {
      return { success: false, message: 'Sync already running' };
    }

    this.isRunning = true;

    try {
      const activeShipments = await db
        .select()
        .from(shipments)
        .where(
          and(
            isNull(shipments.deletedAt),
            isNull(shipments.archivedAt),
            not(inArray(shipments.status, ['delivered', 'cancelled'])),
          ),
        );

      this.logger.log(`Syncing ${activeShipments.length} active shipments`);

      let successCount = 0;
      let failCount = 0;

      for (const shipment of activeShipments) {
        try {
          const synced = await this.syncShipment(shipment);
          if (synced) successCount++;
          else failCount++;
        } catch (error) {
          failCount++;
          this.logger.error(`Sync failed for shipment ${shipment.id}:`, error);
        }
      }

      return {
        success: true,
        message: `Sync complete: ${successCount} success, ${failCount} failed`,
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      this.isRunning = false;
    }
  }
}
