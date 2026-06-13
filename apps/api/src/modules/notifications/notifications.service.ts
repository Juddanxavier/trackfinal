import { Injectable } from '@nestjs/common';
import { eq, and, desc, count } from 'drizzle-orm';
import { db } from '../../database';
import { notifications } from '../../database/schema';
import { CreateNotificationDto, QueryNotificationsDto } from './dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(private eventsGateway: EventsGateway) {}

  async create(organisationId: string, dto: CreateNotificationDto) {
    if (!dto.userId) {
      throw new Error('userId is required');
    }

    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() +
        (process.env.NOTIFICATION_EXPIRY_DAYS
          ? parseInt(process.env.NOTIFICATION_EXPIRY_DAYS)
          : 30),
    );

    const [notification] = await db
      .insert(notifications)
      .values({
        organisationId,
        userId: dto.userId,
        titleKey: dto.titleKey,
        data: dto.data || {},
        expiresAt,
      })
      .returning();

    // Emit real-time via WebSocket to target user
    this.eventsGateway.emitToUser(dto.userId, 'notification', {
      id: notification.id,
      titleKey: notification.titleKey,
      data: notification.data,
      createdAt: notification.createdAt,
    });

    return notification;
  }

  async findAll(
    organisationId: string | undefined,
    userId: string,
    query: QueryNotificationsDto,
  ) {
    const conditions: any[] = [eq(notifications.userId, userId)];

    if (organisationId) {
      conditions.unshift(eq(notifications.organisationId, organisationId));
    }

    if (query.isRead !== undefined) {
      conditions.push(eq(notifications.isRead, query.isRead));
    }

    return db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(query.limit || 20)
      .offset(query.offset || 0);
  }

  async markRead(
    id: string,
    organisationId: string | undefined,
    userId: string,
  ) {
    const conditions: any[] = [
      eq(notifications.id, id),
      eq(notifications.userId, userId),
    ];

    if (organisationId) {
      conditions.push(eq(notifications.organisationId, organisationId));
    }

    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(...conditions))
      .returning();
    return updated;
  }

  async markUnread(
    id: string,
    organisationId: string | undefined,
    userId: string,
  ) {
    const conditions: any[] = [
      eq(notifications.id, id),
      eq(notifications.userId, userId),
    ];

    if (organisationId) {
      conditions.push(eq(notifications.organisationId, organisationId));
    }

    const [updated] = await db
      .update(notifications)
      .set({ isRead: false })
      .where(and(...conditions))
      .returning();
    return updated;
  }

  async getUnreadCount(organisationId: string | undefined, userId: string) {
    const conditions: any[] = [
      eq(notifications.userId, userId),
      eq(notifications.isRead, false),
    ];

    if (organisationId) {
      conditions.unshift(eq(notifications.organisationId, organisationId));
    }

    const result = await db
      .select({ value: count() })
      .from(notifications)
      .where(and(...conditions));
    return result[0]?.value ?? 0;
  }

  async markAllRead(organisationId: string | undefined, userId: string) {
    const conditions: any[] = [
      eq(notifications.userId, userId),
      eq(notifications.isRead, false),
    ];

    if (organisationId) {
      conditions.unshift(eq(notifications.organisationId, organisationId));
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(...conditions));
  }

  async delete(id: string, organisationId: string | undefined, userId: string) {
    const conditions: any[] = [
      eq(notifications.id, id),
      eq(notifications.userId, userId),
    ];

    if (organisationId) {
      conditions.push(eq(notifications.organisationId, organisationId));
    }

    const [removed] = await db
      .delete(notifications)
      .where(and(...conditions))
      .returning();
    return removed;
  }
}
