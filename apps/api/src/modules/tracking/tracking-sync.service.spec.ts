jest.mock('../../database', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TrackingSyncService } from './tracking-sync.service';
import { SeventeenTrackService } from './seventeen-track.service';
import { TrackingRateLimiter } from './tracking-rate-limiter';
import { TrackingParserService } from './tracking-parser.service';
import { NotificationService } from '../notifications/notification.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { db } from '../../database';

describe('TrackingSyncService', () => {
  let service: TrackingSyncService;
  let seventeenTrackService: jest.Mocked<SeventeenTrackService>;
  let notificationService: jest.Mocked<NotificationService>;
  let webhooksService: jest.Mocked<WebhooksService>;

  const resolveThenable = (data: any) => {
    const mock: any = {
      from: jest.fn(() => mock),
      where: jest.fn(async () => data),
      orderBy: jest.fn(() => mock),
      limit: jest.fn(async () => []),
      then: jest.fn((onFulfilled: any) =>
        Promise.resolve(data).then(onFulfilled),
      ),
      catch: jest.fn(),
    };
    return mock;
  };

  const mockSelectResult = (data: any) =>
    (db.select as jest.Mock).mockReturnValue(resolveThenable(data));

  const mockInsertResult = () => {
    const mock = {
      values: jest.fn(() => mock),
      returning: jest.fn(async () => []),
      onConflictDoNothing: jest.fn(async () => []),
    };
    (db.insert as jest.Mock).mockReturnValue(mock);
    return mock;
  };

  const mockUpdateResult = () => {
    const mock = {
      set: jest.fn(() => mock),
      where: jest.fn(async () => []),
    };
    (db.update as jest.Mock).mockReturnValue(mock);
    return mock;
  };

  const sampleShipment: any = {
    id: 'ship-1',
    trackingNumber: '1Z999AA10123456784',
    carrierCode: 'UPS',
    status: 'in_transit',
    organisationId: 'org-1',
    userId: 'user-1',
    recipientEmail: 'test@example.com',
    recipientPhone: null,
    recipientName: 'John Doe',
    destinationCountry: 'US',
    originCountry: null,
    whiteLabelTrackingCode: null,
    track17Data: null,
    deliveredAt: null,
    deletedAt: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingSyncService,
        TrackingRateLimiter,
        TrackingParserService,
        {
          provide: SeventeenTrackService,
          useValue: {
            getTracking: jest.fn(),
            register: jest.fn(),
            getPendingJobs: jest.fn(),
            processJob: jest.fn(),
            getSettings: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendToAll: jest.fn(),
          },
        },
        {
          provide: WebhooksService,
          useValue: {
            dispatch: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'TRACKING_POLL_INTERVAL') return 60;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TrackingSyncService>(TrackingSyncService);
    seventeenTrackService = module.get(
      SeventeenTrackService,
    ) as jest.Mocked<SeventeenTrackService>;
    notificationService = module.get(
      NotificationService,
    ) as jest.Mocked<NotificationService>;
    webhooksService = module.get(
      WebhooksService,
    ) as jest.Mocked<WebhooksService>;
  });

  describe('syncShipment', () => {
    it('returns true and updates shipment when tracking data is found', async () => {
      const trackingData = {
        trackingNumber: '1Z999AA10123456784',
        carrierCode: '100002',
        status: 'delivered',
        statusRaw: 'Delivered',
        originCountry: 'US',
        destinationCountry: 'US',
        lastEvent: 'Delivered',
        lastEventTime: '2024-01-15T10:30:00Z',
        lastLocation: 'Front door',
        events: [],
        rawData: {},
      } as any;

      seventeenTrackService.getTracking.mockResolvedValue(trackingData as any);
      mockUpdateResult();
      mockSelectResult([]);
      mockInsertResult();

      const result = await service.syncShipment(sampleShipment);

      expect(result).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });

    it('returns false when no tracking data is returned', async () => {
      seventeenTrackService.getTracking.mockResolvedValue(null);

      const result = await service.syncShipment(sampleShipment);

      expect(result).toBe(false);
      expect(db.update).not.toHaveBeenCalled();
    });
  });

  describe('registerShipment', () => {
    it('calls syncShipment on successful registration', async () => {
      seventeenTrackService.register.mockResolvedValue({
        trackingNumber: '1Z999AA10123456784',
        carrierCode: '100002',
        success: true,
      });
      seventeenTrackService.getTracking.mockResolvedValue({
        trackingNumber: '1Z999AA10123456784',
        carrierCode: '100002',
        status: 'pending',
        statusRaw: 'InfoReceived',
        originCountry: null,
        destinationCountry: null,
        lastEvent: null,
        lastEventTime: null,
        lastLocation: null,
        events: [],
        rawData: {},
      });
      mockUpdateResult();
      mockSelectResult([]);
      mockInsertResult();

      const result = await service.registerShipment(sampleShipment);

      expect(result.success).toBe(true);
      expect(seventeenTrackService.register).toHaveBeenCalledWith(
        '1Z999AA10123456784',
        'UPS',
        { tag: '1Z999AA10123456784' },
      );
      expect(seventeenTrackService.getTracking).toHaveBeenCalled();
    });

    it('does not sync when registration fails', async () => {
      seventeenTrackService.register.mockResolvedValue({
        trackingNumber: '1Z999AA10123456784',
        carrierCode: '100002',
        success: false,
        error: 'Invalid number',
      });

      const result = await service.registerShipment(sampleShipment);

      expect(result.success).toBe(false);
      expect(seventeenTrackService.getTracking).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('processes each payload item', async () => {
      mockSelectResult([]);

      const payload = [
        {
          number: '1Z999AA10123456784',
          carrier: 100002,
          tag: 'InfoReceived',
          track_info: {
            latest_status: { status: 'InfoReceived' },
            latest_event: {
              description: 'Info received',
              location: 'US',
              time_utc: '2024-01-15T10:30:00Z',
            },
          },
        },
      ];

      const result = await service.handleWebhook(payload);

      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
    });

    it('skips items without track_info', async () => {
      const payload = [{ number: '1Z999AA10123456784', carrier: 100002, tag: 'web' }];

      const result = await service.handleWebhook(payload);

      expect(result.processed).toBe(1);
    });

    it('skips items for unknown shipments', async () => {
      mockSelectResult([]);

      const payload = [
        {
          number: 'UNKNOWN',
          carrier: 100002,
          tag: 'web',
          track_info: {
            latest_status: { status: 'Delivered' },
          },
        },
      ];

      const result = await service.handleWebhook(payload);

      expect(result.processed).toBe(1);
    });

    it('skips items when status is unchanged', async () => {
      mockSelectResult([{ ...sampleShipment, status: 'in_transit' }]);

      const payload = [
        {
          number: '1Z999AA10123456784',
          carrier: 100002,
          tag: 'web',
          track_info: {
            latest_status: { status: 'InTransit' },
          },
        },
      ];

      const result = await service.handleWebhook(payload);

      expect(result.processed).toBe(1);
      expect(db.update).not.toHaveBeenCalled();
    });

    it('updates shipment and sends notification on status change', async () => {
      mockSelectResult([{ ...sampleShipment, status: 'pending' }]);
      mockUpdateResult();
      mockInsertResult();

      const payload = [
        {
          number: '1Z999AA10123456784',
          carrier: 100002,
          track_info: {
            latest_status: { status: 'Delivered' },
            latest_event: {
              description: 'Package delivered',
              location: 'Front door',
              time_utc: '2024-01-15T10:30:00Z',
            },
          },
        },
      ];

      const result = await service.handleWebhook(payload as any);

      expect(result.processed).toBe(1);
      expect(db.update).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
    });

    it('dispatches webhook event for relevant statuses', async () => {
      mockSelectResult([{ ...sampleShipment, status: 'pending' }]);
      mockUpdateResult();
      mockInsertResult();
      webhooksService.dispatch.mockResolvedValue(undefined as never);

      const payload: any = [
        {
          number: '1Z999AA10123456784',
          carrier: 100002,
          track_info: {
            latest_status: { status: 'Delivered' },
            latest_event: {
              description: 'Package delivered',
              location: 'Front door',
              time_utc: '2024-01-15T10:30:00Z',
            },
          },
        },
      ];

      await service.handleWebhook(payload);

      expect(webhooksService.dispatch).toHaveBeenCalledWith(
        'delivered',
        expect.objectContaining({
          trackingNumber: '1Z999AA10123456784',
          status: 'delivered',
        }),
        'org-1',
      );
    });
  });

  describe('triggerManualSync', () => {
    it('returns success when sync completes', async () => {
      mockSelectResult([sampleShipment]);
      seventeenTrackService.getTracking.mockResolvedValue({
        trackingNumber: '1Z999AA10123456784',
        carrierCode: '100002',
        status: 'delivered',
        statusRaw: 'Delivered',
        originCountry: null,
        destinationCountry: null,
        lastEvent: null,
        lastEventTime: null,
        lastLocation: null,
        events: [],
        rawData: {},
      });
      mockUpdateResult();
      mockInsertResult();

      const result = await service.triggerManualSync('ship-1');

      expect(result.success).toBe(true);
    });

    it('returns failure when shipment not found', async () => {
      mockSelectResult([]);

      const result = await service.triggerManualSync('nonexistent');

      expect(result.success).toBe(false);
    });

    it('returns failure when sync returns false', async () => {
      mockSelectResult([sampleShipment]);
      seventeenTrackService.getTracking.mockResolvedValue(null);

      const result = await service.triggerManualSync('ship-1');

      expect(result.success).toBe(false);
    });
  });

  describe('processRetryQueue', () => {
    it('processes pending jobs', async () => {
      seventeenTrackService.getPendingJobs.mockResolvedValue([
        { id: 'job-1' },
        { id: 'job-2' },
      ] as any);
      seventeenTrackService.processJob.mockResolvedValue(true);

      await service.processRetryQueue();

      expect(seventeenTrackService.processJob).toHaveBeenCalledTimes(2);
    });

    it('does nothing when no pending jobs', async () => {
      seventeenTrackService.getPendingJobs.mockResolvedValue([]);

      await service.processRetryQueue();

      expect(seventeenTrackService.processJob).not.toHaveBeenCalled();
    });
  });

  describe('pollStaleShipments', () => {
    it('skips when polling is disabled', async () => {
      seventeenTrackService.getSettings.mockResolvedValue({
        pollingEnabled: false,
      } as any);
      seventeenTrackService.getPendingJobs.mockResolvedValue([]);

      await service.pollStaleShipments();

      expect(seventeenTrackService.getPendingJobs).not.toHaveBeenCalled();
    });

    it('syncs stale shipments when polling is enabled', async () => {
      seventeenTrackService.getSettings.mockResolvedValue({
        pollingEnabled: true,
      } as any);
      mockSelectResult([]);
      seventeenTrackService.getTracking.mockResolvedValue(null);

      await service.pollStaleShipments();

      expect(seventeenTrackService.getSettings).toHaveBeenCalled();
    });
  });

  describe('triggerSyncAll', () => {
    it('syncs all active shipments', async () => {
      mockSelectResult([sampleShipment]);
      seventeenTrackService.getTracking.mockResolvedValue({
        trackingNumber: '1Z999AA10123456784',
        carrierCode: '100002',
        status: 'delivered',
        statusRaw: 'Delivered',
        originCountry: null,
        destinationCountry: null,
        lastEvent: null,
        lastEventTime: null,
        lastLocation: null,
        events: [],
        rawData: {},
      });
      mockUpdateResult();
      mockInsertResult();

      const result = await service.triggerSyncAll();

      expect(result.success).toBe(true);
    });

    it('returns failure if sync is already running', async () => {
      mockSelectResult([]);

      const firstPromise = service.triggerSyncAll();
      const result = await service.triggerSyncAll();
      await firstPromise;

      expect(result.success).toBe(false);
    });
  });
});
