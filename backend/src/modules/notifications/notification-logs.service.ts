import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '../../database';
import { notificationLogs } from '../../database/schema';

@Injectable()
export class NotificationLogsService {
  async logSuccess(
    organisationId: string,
    userId: string,
    shipmentId: string,
    channel: 'email' | 'whatsapp' | 'in_app',
    titleKey: string,
    data: Record<string, any>,
  ) {
    await db.insert(notificationLogs).values({
      organisationId,
      userId,
      shipmentId: shipmentId || null,
      channel,
      titleKey,
      data,
      status: 'sent',
      sentAt: new Date(),
    });
  }

  async logFailure(
    organisationId: string,
    userId: string,
    shipmentId: string,
    channel: 'email' | 'whatsapp' | 'in_app',
    titleKey: string,
    data: Record<string, any>,
    errorMessage: string,
  ) {
    await db.insert(notificationLogs).values({
      organisationId,
      userId,
      shipmentId: shipmentId || null,
      channel,
      titleKey,
      data,
      status: 'failed',
      errorMessage,
    });
  }

  async logQueued(
    organisationId: string,
    userId: string,
    shipmentId: string,
    channel: 'email' | 'whatsapp' | 'in_app',
    titleKey: string,
    data: Record<string, any>,
  ) {
    await db.insert(notificationLogs).values({
      organisationId,
      userId,
      shipmentId: shipmentId || null,
      channel,
      titleKey,
      data,
      status: 'queued',
    });
  }

  async hasSentNotification(
    userId: string,
    shipmentId: string,
    titleKey: string,
    channel: 'email' | 'whatsapp',
  ): Promise<boolean> {
    const existing = await db
      .select()
      .from(notificationLogs)
      .where(
        and(
          eq(notificationLogs.userId, userId),
          eq(notificationLogs.shipmentId, shipmentId),
          eq(notificationLogs.titleKey, titleKey),
          eq(notificationLogs.channel, channel),
          eq(notificationLogs.status, 'sent'),
        ),
      );

    return existing.length > 0;
  }

  async getLogsForShipment(shipmentId: string) {
    return db
      .select()
      .from(notificationLogs)
      .where(eq(notificationLogs.shipmentId, shipmentId));
  }
}
