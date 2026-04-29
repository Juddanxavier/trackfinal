import { Injectable } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
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
    organisationId: string,
    userId: string,
    query: QueryNotificationsDto,
  ) {
    const conditions = [
      eq(notifications.organisationId, organisationId),
      eq(notifications.userId, userId),
    ];

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

  async markRead(id: string, organisationId: string, userId: string) {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.organisationId, organisationId),
          eq(notifications.userId, userId),
        ),
      )
      .returning();
    return updated;
  }

  async markUnread(id: string, organisationId: string, userId: string) {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: false })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.organisationId, organisationId),
          eq(notifications.userId, userId),
        ),
      )
      .returning();
    return updated;
  }

  async getUnreadCount(organisationId: string, userId: string) {
    const result = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.organisationId, organisationId),
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
        ),
      );
    return result.length;
  }

  async markAllRead(organisationId: string, userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.organisationId, organisationId),
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
        ),
      );
  }
}
