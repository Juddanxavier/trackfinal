import { Injectable } from '@nestjs/common';
import { eq, and, gte } from 'drizzle-orm';
import { db } from '../../database';
import { notificationLogs } from '../../database/schema';

@Injectable()
export class NotificationLogsService {
  private async log(
    organisationId: string,
    userId: string | null,
    shipmentId: string | null,
    channel: 'email' | 'whatsapp' | 'in_app',
    titleKey: string,
    data: Record<string, any>,
    status: 'sent' | 'failed' | 'queued',
    errorMessage?: string,
  ) {
    const insertData: any = {
      organisationId,
      channel,
      titleKey,
      data,
      status,
    };
    if (userId) insertData.userId = userId;
    if (shipmentId) insertData.shipmentId = shipmentId;
    if (errorMessage) insertData.errorMessage = errorMessage;
    if (status === 'sent') insertData.sentAt = new Date();
    await db.insert(notificationLogs).values(insertData);
  }

  async logSuccess(
    organisationId: string,
    userId: string | null,
    shipmentId: string | null,
    channel: 'email' | 'whatsapp' | 'in_app',
    titleKey: string,
    data: Record<string, any>,
  ) {
    await this.log(
      organisationId,
      userId,
      shipmentId,
      channel,
      titleKey,
      data,
      'sent',
    );
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
    await this.log(
      organisationId,
      userId,
      shipmentId,
      channel,
      titleKey,
      data,
      'failed',
      errorMessage,
    );
  }

  async logQueued(
    organisationId: string,
    userId: string | null,
    shipmentId: string | null,
    channel: 'email' | 'whatsapp' | 'in_app',
    titleKey: string,
    data: Record<string, any>,
  ) {
    await this.log(
      organisationId,
      userId,
      shipmentId,
      channel,
      titleKey,
      data,
      'queued',
    );
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

  async getLogsForShipment(
    shipmentId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return db
      .select()
      .from(notificationLogs)
      .where(eq(notificationLogs.shipmentId, shipmentId))
      .limit(limit)
      .offset(offset);
  }

  async getRecentLogs(
    organisationId: string,
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
          eq(notificationLogs.organisationId, organisationId),
          eq(notificationLogs.shipmentId, shipmentId),
          eq(notificationLogs.titleKey, titleKey),
          eq(notificationLogs.channel, channel),
          eq(notificationLogs.status, 'sent'),
          gte(notificationLogs.createdAt, since),
        ),
      );
  }

  async getFailedLogs(organisationId: string, shipmentId: string) {
    return db
      .select()
      .from(notificationLogs)
      .where(
        and(
          eq(notificationLogs.organisationId, organisationId),
          eq(notificationLogs.shipmentId, shipmentId),
          eq(notificationLogs.status, 'failed'),
        ),
      );
  }
}
