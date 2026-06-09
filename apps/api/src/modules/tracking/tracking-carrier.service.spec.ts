import { TrackingCarrierService } from './tracking-carrier.service';

describe('TrackingCarrierService', () => {
  let service: TrackingCarrierService;

  beforeEach(() => {
    service = new TrackingCarrierService();
  });

  describe('getCarrierName', () => {
    it('returns name for known carrier codes', () => {
      expect(service.getCarrierName(100001)).toBe('USPS');
      expect(service.getCarrierName(100002)).toBe('UPS');
      expect(service.getCarrierName(100003)).toBe('FedEx');
      expect(service.getCarrierName(100004)).toBe('DHL');
      expect(service.getCarrierName(100005)).toBe('DHL Express');
      expect(service.getCarrierName(100007)).toBe('EMS');
      expect(service.getCarrierName(100025)).toBe('Chronopost');
    });

    it('returns fallback for unknown codes', () => {
      expect(service.getCarrierName(999999)).toBe('Unknown (999999)');
      expect(service.getCarrierName(0)).toBe('Unknown (0)');
    });
  });

  describe('getCarrierCode', () => {
    it('resolves known names to numeric codes', () => {
      expect(service.getCarrierCode('USPS')).toBe(100001);
      expect(service.getCarrierCode('UPS')).toBe(100002);
      expect(service.getCarrierCode('FedEx')).toBe(100003);
      expect(service.getCarrierCode('DHL Express')).toBe(100005);
    });

    it('is case-insensitive', () => {
      expect(service.getCarrierCode('ups')).toBe(100002);
      expect(service.getCarrierCode('dhl express')).toBe(100005);
      expect(service.getCarrierCode('fedex')).toBe(100003);
    });

    it('trims whitespace', () => {
      expect(service.getCarrierCode('  UPS  ')).toBe(100002);
    });

    it('returns null for unknown names', () => {
      expect(service.getCarrierCode('Unknown Carrier')).toBeNull();
    });
  });

  describe('detectCarrier', () => {
    it('detects UPS by tracking number', () => {
      const result = service.detectCarrier('1Z999AA10123456784');
      expect(result).toEqual({ code: 100002, name: 'UPS' });
    });

    it('detects FedEx by 12-digit number', () => {
      const result = service.detectCarrier('123456789012');
      expect(result).toEqual({ code: 100003, name: 'FedEx' });
    });

    it('detects USPS by 94-prefix', () => {
      const result = service.detectCarrier('94001118992234567890');
      expect(result).toEqual({ code: 100001, name: 'USPS' });
    });

    it('detects DHL by 10-digit number', () => {
      const result = service.detectCarrier('1234567890');
      expect(result).toEqual({ code: 100004, name: 'DHL' });
    });

    it('detects China Post by CN suffix', () => {
      const result = service.detectCarrier('RA123456789CN');
      expect(result).toEqual({ code: 100008, name: 'China Post' });
    });

    it('detects Royal Mail by GB suffix', () => {
      const result = service.detectCarrier('AB123456789GB');
      expect(result).toEqual({ code: 100014, name: 'Royal Mail' });
    });

    it('returns null for unrecognised number', () => {
      const result = service.detectCarrier('Z123');
      expect(result).toBeNull();
    });

    it('handles mixed case input', () => {
      const result = service.detectCarrier('1z999aa10123456784');
      expect(result).toEqual({ code: 100002, name: 'UPS' });
    });

    it('handles EMS E-prefix', () => {
      const result = service.detectCarrier('EA123456789IN');
      expect(result).toEqual({ code: 100007, name: 'EMS' });
    });
  });

  describe('pattern ordering (country-specific before generic)', () => {
    it('correctly detects China Post despite matching UPS generic', () => {
      const result = service.detectCarrier('RA123456789CN');
      expect(result).toEqual({ code: 100008, name: 'China Post' });
    });

    it('correctly detects Royal Mail despite matching UPS generic', () => {
      const result = service.detectCarrier('AB123456789GB');
      expect(result).toEqual({ code: 100014, name: 'Royal Mail' });
    });

    it('correctly detects Australia Post despite matching UPS generic', () => {
      const result = service.detectCarrier('AB123456789AU');
      expect(result).toEqual({ code: 100018, name: 'Australia Post' });
    });

    it('correctly detects Canada Post despite matching UPS generic', () => {
      const result = service.detectCarrier('AB123456789CA');
      expect(result).toEqual({ code: 100013, name: 'Canada Post' });
    });

    it('correctly detects Singapore Post despite matching UPS generic', () => {
      const result = service.detectCarrier('AB123456789SG');
      expect(result).toEqual({ code: 100020, name: 'Singapore Post' });
    });

    it('correctly detects USPS by country suffix', () => {
      const result = service.detectCarrier('AB123456789US');
      expect(result).toEqual({ code: 100001, name: 'USPS' });
    });
  });

  describe('getAllCarriers', () => {
    it('returns all 25 known carriers', () => {
      const carriers = service.getAllCarriers();
      expect(carriers).toHaveLength(25);
    });

    it('includes major carriers', () => {
      const carriers = service.getAllCarriers();
      const names = carriers.map((c) => c.name);
      expect(names).toContain('UPS');
      expect(names).toContain('FedEx');
      expect(names).toContain('DHL');
      expect(names).toContain('USPS');
    });
  });
});
