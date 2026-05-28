import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from '../../database';
import { notificationPreferences } from '../../database/schema';

@Injectable()
export class NotificationPreferencesService {
  async getPreferences(organisationId: string, userId: string) {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.organisationId, organisationId),
          eq(notificationPreferences.userId, userId),
        ),
      );

    if (!prefs) {
      return {
        emailEnabled: true,
        whatsappEnabled: true,
        inTransitNotifications: true,
        deliveredNotifications: true,
      exceptionsNotifications: true,
      };
    }

    return {
      emailEnabled: prefs.emailEnabled ?? true,
      whatsappEnabled: prefs.whatsappEnabled ?? true,
      inTransitNotifications: prefs.inTransitNotifications ?? true,
      deliveredNotifications: prefs.deliveredNotifications ?? true,
      exceptionsNotifications: prefs.exceptionsNotifications ?? true,
    };
  }

  async updatePreferences(
    organisationId: string,
    userId: string,
    data: {
      emailEnabled?: boolean;
      whatsappEnabled?: boolean;
      inTransitNotifications?: boolean;
      deliveredNotifications?: boolean;
      exceptionsNotifications?: boolean;
    },
  ) {
    const existing = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.organisationId, organisationId),
          eq(notificationPreferences.userId, userId),
        ),
      );

    if (existing.length > 0) {
      const updated = await db
        .update(notificationPreferences)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(notificationPreferences.organisationId, organisationId),
            eq(notificationPreferences.userId, userId),
          ),
        )
        .returning();
      return updated[0];
    } else {
      const created = await db
        .insert(notificationPreferences)
        .values({
          organisationId,
          userId,
          ...data,
        })
        .returning();
      return created[0];
    }
  }

  async isChannelEnabled(
    organisationId: string,
    userId: string,
    channel: 'email' | 'whatsapp',
  ): Promise<boolean> {
    const prefs = await this.getPreferences(organisationId, userId);
    return channel === 'email' ? prefs.emailEnabled : prefs.whatsappEnabled;
  }

  async shouldSendNotification(
    organisationId: string,
    userId: string,
    notificationType: 'in_transit' | 'delivered' | 'exception',
  ): Promise<boolean> {
    const prefs = await this.getPreferences(organisationId, userId);

    if (notificationType === 'in_transit') {
      return prefs.inTransitNotifications;
    } else if (notificationType === 'delivered') {
      return prefs.deliveredNotifications;
    } else if (notificationType === 'exception') {
      return prefs.exceptionsNotifications;
    }

    return true;
  }
}
