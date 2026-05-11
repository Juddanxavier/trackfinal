import { Injectable } from '@nestjs/common';
import { eq, and, gte } from 'drizzle-orm';
import { db } from '../../database';
import { notificationLogs } from '../../database/schema';

@Injectable()
export class NotificationLogsService {
  async logSuccess(
    organisationId: string,
    userId: string | null,
    shipmentId: string | null,
    channel: 'email' | 'whatsapp' | 'in_app',
    titleKey: string,
    data: Record<string, any>,
  ) {
    const insertData: any = {
      organisationId,
      channel,
      titleKey,
      data,
      status: 'sent',
      sentAt: new Date(),
    };
    if (userId) insertData.userId = userId;
    if (shipmentId) insertData.shipmentId = shipmentId;
    await db.insert(notificationLogs).values(insertData);
  }

  async logFailure(
    organisationId: string,
    userId: string | null,
    shipmentId: string | null,
    channel: 'email' | 'whatsapp' | 'in_app',
    titleKey: string,
    data: Record<string, any>,
    errorMessage: string,
  ) {
    const insertData: any = {
      organisationId,
      channel,
      titleKey,
      data,
      status: 'failed',
      errorMessage,
    };
    if (userId) insertData.userId = userId;
    if (shipmentId) insertData.shipmentId = shipmentId;
    await db.insert(notificationLogs).values(insertData);
  }

  async logQueued(
    organisationId: string,
    userId: string | null,
    shipmentId: string | null,
    channel: 'email' | 'whatsapp' | 'in_app',
    titleKey: string,
    data: Record<string, any>,
  ) {
    const insertData: any = {
      organisationId,
      channel,
      titleKey,
      data,
      status: 'queued',
    };
    if (userId) insertData.userId = userId;
    if (shipmentId) insertData.shipmentId = shipmentId;
    await db.insert(notificationLogs).values(insertData);
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

  async getRecentLogs(
    shipmentId: string,
    titleKey: string,
    channel: string,
    since: Date,
  ) {
    return db
      .select()
      .from(notificationLogs)
      .where(
        and(
          eq(notificationLogs.shipmentId, shipmentId),
          eq(notificationLogs.titleKey, titleKey),
          eq(notificationLogs.channel, channel),
          eq(notificationLogs.status, 'sent'),
          gte(notificationLogs.createdAt, since),
        ),
      );
  }

  async getFailedLogs(shipmentId: string) {
    return db
      .select()
      .from(notificationLogs)
      .where(
        and(
          eq(notificationLogs.shipmentId, shipmentId),
          eq(notificationLogs.status, 'failed'),
        ),
      );
  }
}
