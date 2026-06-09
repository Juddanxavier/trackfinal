import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationChannel,
  NotificationPayload,
  NotificationResult,
} from './channels/notification.channel';
import { EmailChannel } from './channels/email.channel';
import { WhatsAppChannel } from './channels/whatsapp.channel';
import { InAppChannel } from './channels/in-app.channel';
import { NotificationLogsService } from './notification-logs.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { UsersService } from '../users/services';

export type ChannelType = 'email' | 'whatsapp' | 'in_app';

export interface NotificationConfig {
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  inAppEnabled: boolean;
  rateLimitPerDay: number;
  notifyOnInTransit: boolean;
  notifyOnDelivered: boolean;
  notifyOnCancelled: boolean;
  notifyOnException: boolean;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger('NotificationService');
  private config: NotificationConfig;

  constructor(
    private emailChannel: EmailChannel,
    private whatsAppChannel: WhatsAppChannel,
    private inAppChannel: InAppChannel,
    private configService: ConfigService,
    private notificationLogsService: NotificationLogsService,
    private notificationPreferencesService: NotificationPreferencesService,
    private usersService: UsersService,
  ) {
    const envTrue = (key: string, defaultVal: boolean = false) => {
      const val = configService.get(key);
      return val === 'true' || val === true || (val === undefined && defaultVal);
    };

    this.config = {
      emailEnabled: envTrue('NOTIFICATION_EMAIL_ENABLED'),
      whatsappEnabled: envTrue('NOTIFICATION_WHATSAPP_ENABLED'),
      inAppEnabled: envTrue('NOTIFICATION_INAPP_ENABLED'),
      rateLimitPerDay: parseInt(
        configService.get('NOTIFICATION_RATE_LIMIT') || '2',
      ),
      notifyOnInTransit: envTrue('NOTIFY_ON_IN_TRANSIT', true),
      notifyOnDelivered: envTrue('NOTIFY_ON_DELIVERED', true),
      notifyOnCancelled: envTrue('NOTIFY_ON_CANCELLED', false),
      notifyOnException: envTrue('NOTIFY_ON_EXCEPTION', false),
    };

    this.logger.log(
      `Channels enabled: ${this.getAvailableChannels().join(', ')}`,
    );
    this.logger.log(`Rate limit: ${this.config.rateLimitPerDay} per day`);
    this.logger.log(
      `Status triggers: inTransit=${this.config.notifyOnInTransit}, delivered=${this.config.notifyOnDelivered}, cancelled=${this.config.notifyOnCancelled}, exception=${this.config.notifyOnException}`,
    );
  }

  shouldNotifyForStatus(status: string): boolean {
    switch (status) {
      case 'in_transit':
        return this.config.notifyOnInTransit;
      case 'delivered':
        return this.config.notifyOnDelivered;
      case 'cancelled':
        return this.config.notifyOnCancelled;
      case 'exception':
        return this.config.notifyOnException;
      default:
        return false;
    }
  }

  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  async updateConfig(newConfig: Partial<NotificationConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    this.logger.log(
      `Config updated. Channels: ${this.getAvailableChannels().join(', ')}`,
    );
  }

  async send(
    payload: NotificationPayload,
    channels: ChannelType[],
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const channelName of channels) {
      const channel = this.getChannel(channelName);
      if (!channel) {
        results.push({
          success: false,
          channel: channelName,
          error: `Channel ${channelName} not registered`,
        });
        continue;
      }

      if (!channel.canSend(payload)) {
        results.push({
          success: false,
          channel: channelName,
          error: `Cannot send via ${channelName}: missing required data`,
        });
        continue;
      }

      const channelKey = channelName === 'in_app' ? 'in_app' : channelName;
      const alreadySent =
        payload.shipmentId &&
        (await this.checkRateLimit(
          payload.organisationId,
          payload.userId,
          payload.shipmentId,
          payload.titleKey,
          channelKey,
        ));

      if (alreadySent) {
        this.logger.log(
          `Rate limited: ${payload.titleKey} already sent to ${payload.userId} for shipment ${payload.shipmentId} via ${channelName}`,
        );
        results.push({
          success: false,
          channel: channelName,
          error: 'Rate limited: already sent within 24 hours',
        });
        continue;
      }

      try {
        const result = await channel.send(payload);

        if (payload.shipmentId) {
          await this.logNotification(
            payload,
            channelName,
            result.success ? 'sent' : 'failed',
            result.error,
          );
        }

        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          channel: channelName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  private async checkRateLimit(
    organisationId: string,
    userId: string | undefined,
    shipmentId: string | undefined,
    titleKey: string,
    channel: string,
  ): Promise<boolean> {
    if (!shipmentId || !userId) return false;

    const threshold = new Date();
    threshold.setHours(threshold.getHours() - 24);

    const logs = await this.notificationLogsService.getRecentLogs(
      organisationId,
      shipmentId,
      titleKey,
      channel,
      threshold,
    );

    return (
      logs.filter((log) => log.userId === userId).length >=
      this.config.rateLimitPerDay
    );
  }

  private async logNotification(
    payload: NotificationPayload,
    channel: string,
    status: 'sent' | 'failed',
    error?: string,
  ): Promise<void> {
    if (!payload.shipmentId) return;

    if (status === 'sent') {
      await this.notificationLogsService.logSuccess(
        payload.organisationId,
        payload.userId || '',
        payload.shipmentId,
        channel as 'email' | 'whatsapp' | 'in_app',
        payload.titleKey,
        payload.data,
      );
    } else {
      await this.notificationLogsService.logFailure(
        payload.organisationId,
        payload.userId || '',
        payload.shipmentId,
        channel as 'email' | 'whatsapp' | 'in_app',
        payload.titleKey,
        payload.data,
        error || 'Unknown error',
      );
    }
  }

  async retryFailed(organisationId: string, shipmentId: string, channel?: string): Promise<number> {
    const failedLogs =
      await this.notificationLogsService.getFailedLogs(organisationId, shipmentId);
    let retried = 0;

    for (const log of failedLogs) {
      if (channel && log.channel !== channel) continue;

      const payload: NotificationPayload = {
        organisationId: log.organisationId,
        userId: log.userId,
        titleKey: log.titleKey,
        data: log.data as Record<string, any>,
        shipmentId: log.shipmentId || undefined,
      };

      if (log.channel === 'email' && payload.userId) {
        const user = await this.getUserEmail(log.userId);
        payload.recipientEmail = user?.email;
      } else if (log.channel === 'whatsapp' && payload.userId) {
        const user = await this.getUserPhone(log.userId);
        payload.recipientPhone = user?.phone;
      }

      const results = await this.send(payload, [log.channel as ChannelType]);

      if (results[0]?.success) {
        retried++;
      }
    }

    return retried;
  }

  private async getUserEmail(
    userId: string,
  ): Promise<{ email?: string } | null> {
    const user = await this.usersService.findById(userId);
    return user ? { email: user.email } : null;
  }

  private async getUserPhone(
    userId: string,
  ): Promise<{ phone?: string } | null> {
    const user = await this.usersService.findById(userId);
    return user ? { phone: user.phoneNumber || undefined } : null;
  }

  async sendToAll(payload: NotificationPayload): Promise<NotificationResult[]> {
    // Check if this status should trigger notification (from .env config)
    const status = payload.titleKey.replace('shipment.', '');
    if (!this.shouldNotifyForStatus(status)) {
      this.logger.debug(`Notifications disabled for status: ${status}`);
      return [];
    }

    const activeChannels: ChannelType[] = [];

    let pref = {
      emailEnabled: true,
      whatsappEnabled: true,
      inTransitNotifications: true,
      deliveredNotifications: true,
    };

    if (payload.userId) {
      pref = await this.notificationPreferencesService.getPreferences(
        payload.organisationId,
        payload.userId,
      );
    }

    const isInTransit = payload.titleKey === 'shipment.in_transit';
    const isDelivered = payload.titleKey === 'shipment.delivered';
    const shouldNotify = isInTransit
      ? pref.inTransitNotifications
      : isDelivered
        ? pref.deliveredNotifications
        : true;

    if (
      this.config.emailEnabled &&
      payload.recipientEmail &&
      pref.emailEnabled &&
      shouldNotify
    ) {
      activeChannels.push('email');
    }
    if (
      this.config.whatsappEnabled &&
      payload.recipientPhone &&
      pref.whatsappEnabled &&
      shouldNotify
    ) {
      activeChannels.push('whatsapp');
    }
    if (this.config.inAppEnabled && payload.userId && shouldNotify) {
      activeChannels.push('in_app');
    }

    return this.send(payload, activeChannels);
  }

  private getChannel(channelName: ChannelType): NotificationChannel | undefined {
    if (!this.config.emailEnabled && channelName === 'email') return undefined;
    if (!this.config.whatsappEnabled && channelName === 'whatsapp')
      return undefined;
    if (!this.config.inAppEnabled && channelName === 'in_app') return undefined;
    switch (channelName) {
      case 'email':
        return this.emailChannel;
      case 'whatsapp':
        return this.whatsAppChannel;
      case 'in_app':
        return this.inAppChannel;
    }
  }

  isChannelAvailable(channelName: ChannelType): boolean {
    return this.getChannel(channelName) !== undefined;
  }

  getAvailableChannels(): ChannelType[] {
    const channels: ChannelType[] = [];
    if (this.config.emailEnabled) channels.push('email');
    if (this.config.whatsappEnabled) channels.push('whatsapp');
    if (this.config.inAppEnabled) channels.push('in_app');
    return channels;
  }
}
