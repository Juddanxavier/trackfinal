import { TrackingParserService } from './tracking-parser.service';

describe('TrackingParserService', () => {
  let service: TrackingParserService;

  beforeEach(() => {
    service = new TrackingParserService();
  });

  describe('mapStatus', () => {
    it('maps known statuses correctly', () => {
      expect(service.mapStatus('Delivered')).toBe('delivered');
      expect(service.mapStatus('InTransit')).toBe('in_transit');
      expect(service.mapStatus('Exception')).toBe('exception');
      expect(service.mapStatus('InfoReceived')).toBe('pending');
      expect(service.mapStatus('NotFound')).toBe('not_found');
      expect(service.mapStatus('OutForDelivery')).toBe('in_transit');
    });

    it('falls back to in_transit for unknown statuses', () => {
      expect(service.mapStatus('SomeUnknownStatus')).toBe('in_transit');
    });

    it('returns not_found for undefined/null', () => {
      expect(service.mapStatus(undefined)).toBe('not_found');
    });
  });

  describe('getCountryName', () => {
    it('resolves known ISO codes', () => {
      expect(service.getCountryName('IN')).toBe('India');
      expect(service.getCountryName('US')).toBe('United States');
      expect(service.getCountryName('GB')).toBe('United Kingdom');
      expect(service.getCountryName('CN')).toBe('China');
    });

    it('is case-insensitive', () => {
      expect(service.getCountryName('in')).toBe('India');
      expect(service.getCountryName('us')).toBe('United States');
    });

    it('returns the original code for unknown codes', () => {
      expect(service.getCountryName('XX')).toBe('XX');
    });

    it('handles empty string', () => {
      expect(service.getCountryName('')).toBe('Unknown');
    });
  });

  describe('parseTrackingResponse', () => {
    it('parses a minimal accepted response', () => {
      const result = service.parseTrackingResponse({
        number: '1Z999AA10123456784',
        carrier: 100002,
      });

      expect(result.trackingNumber).toBe('1Z999AA10123456784');
      expect(result.carrierCode).toBe('100002');
      expect(result.status).toBe('pending');
      expect(result.statusRaw).toBe('Unknown');
      expect(result.events).toEqual([]);
    });

    it('extracts latest event info', () => {
      const result = service.parseTrackingResponse({
        number: 'TEST123',
        carrier: 100003,
        track_info: {
          latest_status: { status: 'Delivered' },
          latest_event: {
            description: 'Package delivered',
            location: 'Front door',
            time_utc: '2024-01-15T10:30:00Z',
          },
        },
      });

      expect(result.status).toBe('delivered');
      expect(result.lastEvent).toBe('Package delivered');
      expect(result.lastLocation).toBe('Front door');
      expect(result.lastEventTime).toBe('2024-01-15T10:30:00.000Z');
    });

    it('extracts origin/destination countries from shipping info', () => {
      const result = service.parseTrackingResponse({
        number: 'TEST456',
        carrier: 100001,
        track_info: {
          shipping_info: {
            shipper_address: { country: 'IN' },
            recipient_address: { country: 'US' },
          },
          latest_status: { status: 'InTransit' },
        },
      });

      expect(result.originCountry).toBe('India');
      expect(result.destinationCountry).toBe('United States');
    });

    it('parses provider events', () => {
      const result = service.parseTrackingResponse({
        number: 'TEST789',
        carrier: 100004,
        track_info: {
          tracking: {
            providers: [
              {
                events: [
                  {
                    stage: 'InTransit',
                    description: 'In transit',
                    location: 'Chicago',
                    time_utc: '2024-01-14T08:00:00Z',
                  },
                  {
                    stage: 'OutForDelivery',
                    description: 'Out for delivery',
                    location: 'New York',
                    time_utc: '2024-01-15T09:00:00Z',
                  },
                ],
              },
            ],
          },
        },
      });

      expect(result.events).toHaveLength(2);
      expect(result.events[0].status).toBe('in_transit');
      expect(result.events[0].location).toBe('Chicago');
      expect(result.events[1].status).toBe('in_transit');
      expect(result.events[1].location).toBe('New York');
    });

    it('uses carrierCode fallback when carrier is missing', () => {
      const result = service.parseTrackingResponse(
        { number: 'TEST000' },
        '100099',
      );

      expect(result.carrierCode).toBe('100099');
    });
  });

  describe('parseLatestStatus', () => {
    it('parses full status object', () => {
      const result = service.parseLatestStatus({
        status: 'Delivered',
        sub_status: 'Signed',
        sub_status_descr: 'Signed by recipient',
      });

      expect(result.status).toBe('delivered');
      expect(result.statusRaw).toBe('Delivered');
      expect(result.description).toBe('Signed by recipient');
    });

    it('defaults when status is missing', () => {
      const result = service.parseLatestStatus({});

      expect(result.status).toBe('pending');
      expect(result.statusRaw).toBe('InfoReceived');
      expect(result.description).toBe('');
    });
  });
});
