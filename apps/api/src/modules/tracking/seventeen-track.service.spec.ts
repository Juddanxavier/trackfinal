jest.mock('../../database', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    execute: jest.fn(),
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SeventeenTrackService } from './seventeen-track.service';
import { TrackingRateLimiter } from './tracking-rate-limiter';
import { TrackingParserService } from './tracking-parser.service';
import { db } from '../../database';
import { CircuitBreakerRegistry } from '../../common/utils/circuit-breaker';

describe('SeventeenTrackService', () => {
  let service: SeventeenTrackService;
  let rateLimiter: TrackingRateLimiter;
  let parser: TrackingParserService;
  let mockDb: jest.Mocked<typeof db>;

  const resolveData = (data: any) => data;

  const mockSelectWhere = (data: any) => {
    const mock: any = {
      from: jest.fn(() => mock),
      where: jest.fn(() => mock),
      orderBy: jest.fn(() => mock),
      limit: jest.fn(async () => data),
      then: jest.fn((onFulfilled: any) =>
        Promise.resolve(data).then(onFulfilled),
      ),
      catch: jest.fn(),
    };
    (db.select as jest.Mock).mockReturnValue(mock);
    return mock;
  };

  const mockInsertReturning = (returnedData: any) => {
    const mock = {
      values: jest.fn(() => mock),
      returning: jest.fn(async () => returnedData),
      onConflictDoNothing: jest.fn(async () => []),
    };
    (db.insert as jest.Mock).mockReturnValue(mock);
    return mock;
  };

  const mockUpdateSet = () => {
    const mock = {
      set: jest.fn(() => mock),
      where: jest.fn(async () => []),
    };
    (db.update as jest.Mock).mockReturnValue(mock);
    return mock;
  };

  function resetCircuitBreaker() {
    const cb = CircuitBreakerRegistry.getOrCreate('17track-api');
    (cb as any).state = 'CLOSED';
    (cb as any).failureCount = 0;
    (cb as any).successCount = 0;
    (cb as any).halfOpenSuccesses = 0;
    (cb as any).lastFailureTime = 0;
    (cb as any).isHalfOpen = false;
    (cb as any).pendingCalls = 0;
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    resetCircuitBreaker();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeventeenTrackService,
        TrackingRateLimiter,
        TrackingParserService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SEVENTEEN_API_KEY') return 'test-api-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SeventeenTrackService>(SeventeenTrackService);
    rateLimiter = module.get<TrackingRateLimiter>(TrackingRateLimiter);
    parser = module.get<TrackingParserService>(TrackingParserService);
    mockDb = db as jest.Mocked<typeof db>;
  });

  describe('getquota', () => {
    it('returns mock data when no API key is configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SeventeenTrackService,
          TrackingRateLimiter,
          TrackingParserService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => 'your-17track-api-key'),
            },
          },
        ],
      }).compile();
      const svc = module.get<SeventeenTrackService>(SeventeenTrackService);

      const result = await svc.getquota();

      expect(result).toEqual({ used: 0, total: 200, remaining: 200 });
    });

    it('parses successful API response', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          code: 0,
          data: { quota_used: 50, quota_total: 200, quota_remain: 150 },
        }),
      });

      const result = await service.getquota();

      expect(result).toEqual({ used: 50, total: 200, remaining: 150 });
    });

    it('returns null on API error code', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ code: 1001, data: null }),
      });

      const result = await service.getquota();

      expect(result).toBeNull();
    });

    it('returns default values on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.getquota();

      expect(result).toEqual({ used: 0, total: 200, remaining: 200 });
    });
  });

  describe('register', () => {
    it('queues a job when rate limited', async () => {
      rateLimiter.setLimits({ register: { maxRequests: 0, windowMs: 60000 } });

      mockInsertReturning([
        { id: 'job-1', trackingNumber: 'ABC123', status: 'pending' },
      ]);

      const result = await service.register('ABC123', 'UPS');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limited');
      expect(db.insert).toHaveBeenCalled();
    });

    it('returns success when API accepts registration', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          code: 0,
          data: {
            accepted: [{ number: 'ABC123', carrier: 100002 }],
          },
        }),
      });

      const result = await service.register('ABC123', '100002');

      expect(result.success).toBe(true);
      expect(result.trackingNumber).toBe('ABC123');
      expect(result.carrierCode).toBe('100002');
    });

    it('uses circuit breaker fallback on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const result = await service.register('ABC123', '100002');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Service temporarily unavailable');
    });

    it('handles API rejection', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          code: 1001,
          data: {
            rejected: [
              {
                number: 'ABC123',
                error: { code: 1001, message: 'Invalid tracking number' },
              },
            ],
          },
        }),
      });

      const result = await service.register('ABC123', '100002');

      expect(result.success).toBe(false);
    });

    it('uses circuit breaker fallback when circuit is open', async () => {
      mockFetch.mockRejectedValue(new Error('Timeout'));
      for (let i = 0; i < 5; i++) {
        mockSelectWhere([]);
        mockUpdateSet();
        mockInsertReturning([{ id: 'event-1' }]);
        await service.getTracking('fail-' + i).catch(() => {});
      }

      mockFetch.mockReset();
      mockFetch.mockRejectedValue(new Error('Should not reach API'));

      const result = await service.register('ABC123', '100002');

      expect(result.success).toBe(false);
    });
  });

  describe('getTracking', () => {
    it('returns null when rate limited', async () => {
      rateLimiter.setLimits({
        gettrackinfo: { maxRequests: 0, windowMs: 60000 },
      });

      mockInsertReturning([
        { id: 'job-2', trackingNumber: 'ABC123', status: 'pending' },
      ]);

      const result = await service.getTracking('ABC123');

      expect(result).toBeNull();
    });

    it('returns parsed tracking data on success', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          code: 0,
          data: {
            accepted: [
              {
                number: 'ABC123',
                carrier: 100002,
                track_info: {
                  latest_status: { status: 'Delivered' },
                  latest_event: {
                    description: 'Delivered',
                    location: 'Front door',
                    time_utc: '2024-01-15T10:30:00Z',
                  },
                },
              },
            ],
          },
        }),
      });

      const result = await service.getTracking('ABC123', '100002');

      expect(result).not.toBeNull();
      expect(result!.trackingNumber).toBe('ABC123');
      expect(result!.status).toBe('delivered');
    });

    it('returns null when API returns error code', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ code: 1001, data: null }),
      });

      const result = await service.getTracking('ABC123');

      expect(result).toBeNull();
    });

    it('returns null on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API timeout'));

      const result = await service.getTracking('ABC123');

      expect(result).toBeNull();
    });
  });

  describe('createJob', () => {
    it('inserts job and event records', async () => {
      const fakeJob = { id: 'job-1', trackingNumber: 'ABC123' };
      mockInsertReturning([fakeJob]);

      const result = await service.createJob('ABC123', 'UPS', 'register', {
        shipmentId: 'ship-1',
      });

      expect(result).toEqual(fakeJob);
      expect(db.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('processJob', () => {
    it('returns false for non-existent job', async () => {
      mockSelectWhere([]);

      const result = await service.processJob('nonexistent');

      expect(result).toBe(false);
    });

    it('returns false for completed/failed job', async () => {
      mockSelectWhere([{ id: 'job-1', status: 'completed', attempts: 1 }]);

      const result = await service.processJob('job-1');

      expect(result).toBe(false);
    });

    it('processes a gettrackinfo job successfully', async () => {
      mockSelectWhere([
        {
          id: 'job-1',
          trackingNumber: 'ABC123',
          carrierCode: 'UPS',
          status: 'pending',
          attempts: 0,
          maxAttempts: 3,
          metadata: { operation: 'gettrackinfo' },
        },
      ]);

      mockUpdateSet();
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          code: 0,
          data: {
            accepted: [{ number: 'ABC123', carrier: 100002 }],
          },
        }),
      });
      mockInsertReturning([{ id: 'event-1' }]);

      const result = await service.processJob('job-1');

      expect(result).toBe(true);
    });

    it('schedules retry for rate-limited jobs', async () => {
      rateLimiter.setLimits({
        gettrackinfo: { maxRequests: 0, windowMs: 60000 },
      });

      mockSelectWhere([
        {
          id: 'job-1',
          trackingNumber: 'ABC123',
          carrierCode: 'UPS',
          status: 'pending',
          attempts: 0,
          maxAttempts: 3,
          metadata: { operation: 'gettrackinfo' },
        },
      ]);

      mockUpdateSet();
      mockInsertReturning([{ id: 'event-1' }]);

      const result = await service.processJob('job-1');

      expect(result).toBe(false);
    });
  });

  describe('getPendingJobs', () => {
    it('returns jobs with pending or retrying status', async () => {
      const fakeJobs = [
        { id: 'job-1', trackingNumber: 'ABC123', status: 'pending' },
      ];
      mockSelectWhere(fakeJobs);

      const result = await service.getPendingJobs(50);

      expect(result).toEqual(fakeJobs);
    });
  });

  describe('getSettings', () => {
    it('returns org-specific settings when organisationId is provided', async () => {
      const fakeSettings = {
        id: 1,
        organisationId: 'org-1',
        pollingEnabled: true,
      };
      mockSelectWhere([fakeSettings]);

      const result = await service.getSettings('org-1');

      expect(result).toEqual(fakeSettings);
    });

    it('falls back to global settings when no org match', async () => {
      const mock: any = {
        from: jest.fn(() => mock),
        where: jest.fn(async () => []),
      };
      (db.select as jest.Mock).mockReturnValueOnce(mock);

      const mock2: any = {
        from: jest.fn(() => mock2),
        where: jest.fn(async () => [
          {
            id: 2,
            organisationId: null,
            pollingEnabled: true,
          },
        ]),
      };
      (db.select as jest.Mock).mockReturnValueOnce(mock2);

      const result = await service.getSettings('org-1');

      expect(result).toEqual(
        expect.objectContaining({ id: 2, pollingEnabled: true }),
      );
    });
  });

  describe('updateSettings', () => {
    it('updates existing org settings', async () => {
      mockSelectWhere([
        { id: 1, organisationId: 'org-1', pollingEnabled: true },
      ]);

      const updateMock = {
        set: jest.fn(() => updateMock),
        where: jest.fn(() => updateMock),
        returning: jest.fn(async () => [{ id: 1, pollingEnabled: false }]),
      };
      (db.update as jest.Mock).mockReturnValue(updateMock);

      const result = await service.updateSettings('org-1', {
        pollingEnabled: false,
      });

      expect(result).toBeDefined();
      expect(db.update).toHaveBeenCalled();
    });

    it('inserts new settings when no existing org record', async () => {
      const mock: any = {
        from: jest.fn(() => mock),
        where: jest.fn(async () => []),
      };
      (db.select as jest.Mock).mockReturnValue(mock);

      mockInsertReturning([
        { id: 1, organisationId: 'org-1', pollingEnabled: false },
      ]);

      const result = await service.updateSettings('org-1', {
        pollingEnabled: false,
      });

      expect(result).toBeDefined();
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('changeInfo', () => {
    it('returns empty when no items provided', async () => {
      const result = await service.changeInfo([]);

      expect(result).toEqual({ accepted: [], rejected: [] });
    });

    it('calls API and parses accepted/rejected', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          code: 0,
          data: {
            accepted: [{ number: 'ABC123' }],
            rejected: [
              {
                number: 'DEF456',
                error: { message: 'Invalid' },
              },
            ],
          },
        }),
      });

      const result = await service.changeInfo([
        { number: 'ABC123', carrier: 100002 },
        { number: 'DEF456', carrier: 100003 },
      ]);

      expect(result.accepted).toEqual(['ABC123']);
      expect(result.rejected).toEqual([{ number: 'DEF456', error: 'Invalid' }]);
    });

    it('handles API error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ code: 500, data: null }),
      });

      const result = await service.changeInfo([
        { number: 'ABC123', carrier: 100002 },
      ]);

      expect(result.accepted).toEqual([]);
      expect(result.rejected.length).toBe(1);
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.changeInfo([
        { number: 'ABC123', carrier: 100002 },
      ]);

      expect(result.accepted).toEqual([]);
      expect(result.rejected[0].error).toContain('Network error');
    });
  });

  describe('stopTrack', () => {
    it('calls API and returns accepted/rejected', async () => {
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          code: 0,
          data: {
            accepted: [{ number: 'ABC123' }],
            rejected: [],
          },
        }),
      });

      const result = await service.stopTrack([
        { number: 'ABC123', carrier: 100002 },
      ]);

      expect(result.accepted).toEqual(['ABC123']);
    });
  });

  describe('retrans', () => {
    it('skips items already retried', async () => {
      mockSelectWhere([{ count: 1 }]);

      const result = await service.retrans([
        { number: 'ABC123', carrier: 100002 },
      ]);

      expect(result.accepted).toEqual([]);
      expect(result.rejected[0].error).toContain('already attempted');
    });

    it('calls retrack API for new items', async () => {
      const mock: any = {
        from: jest.fn(() => mock),
        where: jest.fn(async () => [{ count: 0 }]),
      };
      (db.select as jest.Mock).mockReturnValue(mock);

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          code: 0,
          data: {
            accepted: [{ number: 'ABC123' }],
            rejected: [],
          },
        }),
      });

      mockInsertReturning([]);

      const result = await service.retrans([
        { number: 'ABC123', carrier: 100002 },
      ]);

      expect(result.accepted).toEqual([{ number: 'ABC123' }]);
    });
  });

  describe('changeCarrier', () => {
    it('rejects items that have reached max changes', async () => {
      mockSelectWhere([{ count: 5 }]);

      const result = await service.changeCarrier([
        { number: 'ABC123', carrier_old: 100001, carrier_new: 100002 },
      ]);

      expect(result.accepted).toEqual([]);
      expect(result.rejected[0].error).toContain('Max');
    });

    it('calls changecarrier API', async () => {
      mockSelectWhere([{ count: 0 }]);

      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          code: 0,
          data: {
            accepted: [{ number: 'ABC123' }],
            rejected: [],
          },
        }),
      });

      mockInsertReturning([]);

      const result = await service.changeCarrier([
        { number: 'ABC123', carrier_old: 100001, carrier_new: 100002 },
      ]);

      expect(result.accepted).toEqual([{ number: 'ABC123' }]);
    });
  });

  describe('getChangeCarrierAttempts', () => {
    it('returns attempt count and remaining', async () => {
      const mock: any = {
        from: jest.fn(() => mock),
        where: jest.fn(async () => [{ count: 2 }]),
      };
      (db.select as jest.Mock).mockReturnValue(mock);

      const result = await service.getChangeCarrierAttempts('ABC123');

      expect(result.attempts).toBe(2);
      expect(result.attempts_left).toBe(3);
    });
  });
});
