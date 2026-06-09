jest.mock('../../database', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TrackingRateLimiter } from './tracking-rate-limiter';
import { db } from '../../database';

describe('TrackingRateLimiter', () => {
  let service: TrackingRateLimiter;
  let configService: jest.Mocked<ConfigService>;

  const mockDb = db as jest.Mocked<typeof db>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const selectMock = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
    };
    mockDb.select = jest.fn().mockReturnValue(selectMock as any);

    const insertMock = {
      values: jest.fn().mockReturnThis(),
      onConflictDoUpdate: jest.fn().mockResolvedValue([]),
    };
    mockDb.insert = jest.fn().mockReturnValue(insertMock as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingRateLimiter,
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

    service = module.get<TrackingRateLimiter>(TrackingRateLimiter);
    configService = module.get(ConfigService);
  });

  describe('checkRateLimit', () => {
    it('allows requests within the limit', async () => {
      const result = await service.checkRateLimit('register');
      expect(result).toBe(true);
    });

    it('blocks requests when limit is exceeded', async () => {
      // Set a very low limit
      service.setLimits({ register: { maxRequests: 2, windowMs: 60000 } });

      const result1 = await service.checkRateLimit('register');
      expect(result1).toBe(true);

      const result2 = await service.checkRateLimit('register');
      expect(result2).toBe(true);

      const result3 = await service.checkRateLimit('register');
      expect(result3).toBe(false);
    });

    it('allows unknown endpoints', async () => {
      const result = await service.checkRateLimit('unknown_endpoint');
      expect(result).toBe(true);
    });

    it('resets window after windowMs passes', async () => {
      service.setLimits({ register: { maxRequests: 1, windowMs: 10 } });

      const r1 = await service.checkRateLimit('register');
      expect(r1).toBe(true);

      const r2 = await service.checkRateLimit('register');
      expect(r2).toBe(false);

      // Wait for window to reset
      await new Promise((resolve) => setTimeout(resolve, 15));

      const r3 = await service.checkRateLimit('register');
      expect(r3).toBe(true);
    });
  });

  describe('resetEndpoint', () => {
    it('resets the counter for an endpoint', async () => {
      service.setLimits({ register: { maxRequests: 1, windowMs: 60000 } });

      await service.checkRateLimit('register');
      const afterOne = await service.checkRateLimit('register');
      expect(afterOne).toBe(false);

      service.resetEndpoint('register');
      const afterReset = await service.checkRateLimit('register');
      expect(afterReset).toBe(true);
    });
  });

  describe('getLimits / setLimits', () => {
    it('returns current limits', () => {
      const limits = service.getLimits();
      expect(limits.register).toEqual({ maxRequests: 100, windowMs: 60000 });
      expect(limits.gettrackinfo).toEqual({
        maxRequests: 500,
        windowMs: 60000,
      });
    });

    it('merges partial overrides', () => {
      service.setLimits({ register: { maxRequests: 50, windowMs: 30000 } });
      const limits = service.getLimits();
      expect(limits.register).toEqual({ maxRequests: 50, windowMs: 30000 });
      expect(limits.gettrackinfo).toEqual({
        maxRequests: 500,
        windowMs: 60000,
      });
    });
  });
});
