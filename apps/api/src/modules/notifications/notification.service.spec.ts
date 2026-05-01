import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { NotificationLogsService } from './notification-logs.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { UsersService } from '../users/services';
import { EmailChannel } from './channels/email.channel';
import { WhatsAppChannel } from './channels/whatsapp.channel';
import { InAppChannel } from './channels/in-app.channel';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'NOTIFICATION_EMAIL_ENABLED') return true;
        if (key === 'NOTIFICATION_WHATSAPP_ENABLED') return true;
        if (key === 'NOTIFICATION_INAPP_ENABLED') return true;
        return defaultValue ?? true;
      }),
    } as unknown as ConfigService;

    const mockLogsService = {} as NotificationLogsService;
    const mockPrefsService = {} as NotificationPreferencesService;
    const mockUsersService = {} as UsersService;

    const emailChannel = { channelName: 'email' } as EmailChannel;
    const whatsAppChannel = { channelName: 'whatsapp' } as WhatsAppChannel;
    const inAppChannel = { channelName: 'in_app' } as InAppChannel;

    service = new NotificationService(
      emailChannel,
      whatsAppChannel,
      inAppChannel,
      mockConfigService,
      mockLogsService,
      mockPrefsService,
      mockUsersService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('should return default config with all channels enabled', () => {
      const config = service.getConfig();
      expect(config.emailEnabled).toBe(true);
      expect(config.whatsappEnabled).toBe(true);
      expect(config.inAppEnabled).toBe(true);
    });
  });

  describe('getAvailableChannels', () => {
    it('should return all channels when enabled', () => {
      const channels = service.getAvailableChannels();
      expect(channels).toContain('email');
      expect(channels).toContain('whatsapp');
      expect(channels).toContain('in_app');
    });
  });

  describe('send', () => {
    it('should send to in_app channel when userId provided', async () => {
      const payload = {
        organisationId: 'org-1',
        userId: 'user-1',
        recipientEmail: undefined,
        recipientPhone: undefined,
        titleKey: 'shipment.created',
        data: { trackingNumber: 'TN123', status: 'pending' },
      };

      const results = await service.send(payload, ['in_app']);

      expect(results).toHaveLength(1);
      expect(results[0].channel).toBe('in_app');
      expect(results[0].success).toBe(true);
    });

    it('should send to email channel when recipientEmail provided', async () => {
      const payload = {
        organisationId: 'org-1',
        userId: undefined,
        recipientEmail: 'test@example.com',
        recipientPhone: undefined,
        titleKey: 'shipment.created',
        data: { trackingNumber: 'TN123', status: 'pending' },
      };

      const results = await service.send(payload, ['email']);

      expect(results).toHaveLength(1);
      expect(results[0].channel).toBe('email');
      expect(results[0].success).toBe(true);
    });

    it('should send to whatsapp channel when recipientPhone provided', async () => {
      const payload = {
        organisationId: 'org-1',
        userId: undefined,
        recipientEmail: undefined,
        recipientPhone: '+1234567890',
        titleKey: 'shipment.created',
        data: { trackingNumber: 'TN123', status: 'pending' },
      };

      const results = await service.send(payload, ['whatsapp']);

      expect(results).toHaveLength(1);
      expect(results[0].channel).toBe('whatsapp');
      expect(results[0].success).toBe(true);
    });

    it('should return error for invalid channel', async () => {
      const payload = {
        organisationId: 'org-1',
        userId: undefined,
        recipientEmail: undefined,
        recipientPhone: undefined,
        titleKey: 'shipment.created',
        data: {},
      };

      const results = await service.send(payload, ['invalid_channel' as any]);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('not registered');
    });
  });

  describe('sendToAll', () => {
    it('should send to all enabled channels with all data provided', async () => {
      const payload = {
        organisationId: 'org-1',
        userId: 'user-1',
        recipientEmail: 'test@example.com',
        recipientPhone: '+1234567890',
        titleKey: 'shipment.created',
        data: { trackingNumber: 'TN123', status: 'pending' },
      };

      const results = await service.sendToAll(payload);

      expect(results).toHaveLength(3);
      const channels = results.map((r) => r.channel);
      expect(channels).toContain('in_app');
      expect(channels).toContain('email');
      expect(channels).toContain('whatsapp');
    });

    it('should only send to in_app when only userId provided', async () => {
      const payload = {
        organisationId: 'org-1',
        userId: 'user-1',
        recipientEmail: undefined,
        recipientPhone: undefined,
        titleKey: 'shipment.created',
        data: { trackingNumber: 'TN123', status: 'pending' },
      };

      const results = await service.sendToAll(payload);

      expect(results).toHaveLength(1);
      expect(results[0].channel).toBe('in_app');
    });

    it('should only send to email when only email provided', async () => {
      const payload = {
        organisationId: 'org-1',
        userId: undefined,
        recipientEmail: 'test@example.com',
        recipientPhone: undefined,
        titleKey: 'shipment.created',
        data: { trackingNumber: 'TN123', status: 'pending' },
      };

      const results = await service.sendToAll(payload);

      expect(results).toHaveLength(1);
      expect(results[0].channel).toBe('email');
    });
  });

  describe('isChannelAvailable', () => {
    it('should return true for enabled channels', () => {
      expect(service.isChannelAvailable('email')).toBe(true);
      expect(service.isChannelAvailable('whatsapp')).toBe(true);
      expect(service.isChannelAvailable('in_app')).toBe(true);
    });
  });
});
