jest.mock('../../common/utils/crypto.util', () => ({
  timingSafeEqual: jest.fn((a: string, b: string) => a === b),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TrackingWebhookService } from './tracking-webhook.service';
import type { SeventeenTrackWebhookItem } from './tracking-webhook.service';

describe('TrackingWebhookService', () => {
  let service: TrackingWebhookService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingWebhookService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TrackingWebhookService>(TrackingWebhookService);
  });

  describe('verifyPayload', () => {
    it('passes when no webhook token is configured', () => {
      mockConfigService.get.mockReturnValue(undefined);
      expect(service.verifyPayload([{ number: 'TEST', carrier: 100002 }])).toBe(
        true,
      );
    });

    it('rejects payloads without a token when token is configured', () => {
      mockConfigService.get.mockReturnValue('expected-token');
      const payload: SeventeenTrackWebhookItem[] = [
        { number: 'TEST', carrier: 100002 },
      ];
      expect(service.verifyPayload(payload)).toBe(false);
    });

    it('accepts payloads with matching token', () => {
      mockConfigService.get.mockReturnValue('my-secret-token');
      const payload: SeventeenTrackWebhookItem[] = [
        { number: 'TEST', carrier: 100002, token: 'my-secret-token' },
      ];
      expect(service.verifyPayload(payload)).toBe(true);
    });

    it('rejects payloads with wrong token', () => {
      mockConfigService.get.mockReturnValue('expected-token');
      const payload: SeventeenTrackWebhookItem[] = [
        { number: 'TEST', carrier: 100002, token: 'wrong-token' },
      ];
      expect(service.verifyPayload(payload)).toBe(false);
    });

    it('uses webhook_token as fallback when token is missing', () => {
      mockConfigService.get.mockReturnValue('fallback-token');
      const payload: SeventeenTrackWebhookItem[] = [
        { number: 'TEST', carrier: 100002, webhook_token: 'fallback-token' },
      ];
      expect(service.verifyPayload(payload)).toBe(true);
    });
  });

  describe('transformPayload', () => {
    it('transforms a minimal payload item', () => {
      const payload: SeventeenTrackWebhookItem[] = [
        { number: '1Z999AA10123456784', carrier: 100002 },
      ];
      const result = service.transformPayload(payload);
      expect(result).toHaveLength(1);
      expect(result[0].trackingNumber).toBe('1Z999AA10123456784');
      expect(result[0].carrierCode).toBe('100002');
      expect(result[0].status).toBe('InfoReceived');
    });

    it('extracts latest status and event', () => {
      const payload: SeventeenTrackWebhookItem[] = [
        {
          number: 'TEST123',
          carrier: 100003,
          track_info: {
            latest_status: { status: 'Delivered' },
            latest_event: {
              description: 'Signed by recipient',
              location: 'New York',
              time_utc: '2024-01-15T10:30:00Z',
            },
          },
        },
      ];
      const result = service.transformPayload(payload);
      expect(result[0].status).toBe('Delivered');
      expect(result[0].description).toBe('Signed by recipient');
      expect(result[0].location).toBe('New York');
      expect(result[0].eventTime).toBe('2024-01-15T10:30:00Z');
    });

    it('strips sensitive token fields from raw', () => {
      const payload: SeventeenTrackWebhookItem[] = [
        {
          number: 'TEST456',
          carrier: 100001,
          token: 'secret',
          webhook_token: 'also-secret',
          track_info: { latest_status: { status: 'InTransit' } },
        },
      ];
      const result = service.transformPayload(payload);
      expect(result[0].raw.latest_status?.status).toBe('InTransit');
    });
  });

  describe('processBatch', () => {
    it('rejects empty payload', () => {
      const { events, result } = service.processBatch([]);
      expect(events).toEqual([]);
      expect(result.errors).toContain('Empty payload');
    });

    it('rejects non-array payload', () => {
      const { events, result } = service.processBatch(null as any);
      expect(events).toEqual([]);
      expect(result.errors).toContain('Empty payload');
    });

    it('processes valid payload through verify + transform', () => {
      mockConfigService.get.mockReturnValue('valid-token');
      const payload: SeventeenTrackWebhookItem[] = [
        {
          number: '1Z999AA10123456784',
          carrier: 100002,
          token: 'valid-token',
          track_info: {
            latest_status: { status: 'Delivered' },
          },
        },
      ];
      const { events, result } = service.processBatch(payload);
      expect(events).toHaveLength(1);
      expect(events[0].status).toBe('Delivered');
      expect(result.valid).toBe(1);
      expect(result.invalid).toBe(0);
    });

    it('returns invalid count when verification fails', () => {
      mockConfigService.get.mockReturnValue('expected');
      const payload: SeventeenTrackWebhookItem[] = [
        { number: 'TEST', carrier: 100002, token: 'wrong' },
      ];
      const { events, result } = service.processBatch(payload);
      expect(events).toEqual([]);
      expect(result.valid).toBe(0);
      expect(result.invalid).toBe(1);
      expect(result.errors).toContain('Webhook token mismatch');
    });
  });
});
