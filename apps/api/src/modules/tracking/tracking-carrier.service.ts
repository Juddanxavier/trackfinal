import { Injectable } from '@nestjs/common';

/**
 * Known 17Track carrier codes mapped to human-readable names.
 * Source: https://api.17track.net/doc/carriers
 */
const CARRIER_CODE_MAP: Record<number, string> = {
  100001: 'USPS',
  100002: 'UPS',
  100003: 'FedEx',
  100004: 'DHL',
  100005: 'DHL Express',
  100006: 'TNT',
  100007: 'EMS',
  100008: 'China Post',
  100009: 'Yanwen',
  100010: '4PX',
  100011: 'ePacket',
  100012: 'SF Express',
  100013: 'Canada Post',
  100014: 'Royal Mail',
  100015: 'Deutsche Post',
  100016: 'La Poste',
  100017: 'Japan Post',
  100018: 'Australia Post',
  100019: 'Correios',
  100020: 'Singapore Post',
  100021: 'Hongkong Post',
  100022: 'DPD',
  100023: 'GLS',
  100024: 'Hermes',
  100025: 'Chronopost',
};

/** Reverse mapping: carrier name → 17Track numeric code. */
const CARRIER_NAME_TO_CODE: Record<string, number> = {};

for (const [code, name] of Object.entries(CARRIER_CODE_MAP)) {
  CARRIER_NAME_TO_CODE[name.toLowerCase()] = Number(code);
}

/**
 * Regex patterns for detecting the carrier from a tracking number.
 * Each entry maps a human-readable carrier name (lowercase) to an
 * array of patterns.  The first match wins.
 */
const CARRIER_DETECTION_PATTERNS: Array<{
  name: string;
  code: number;
  patterns: RegExp[];
}> = [
  // Country-specific suffix patterns must come before generic patterns
  // to avoid the generic UPS/EMS patterns matching first.
  {
    name: 'China Post',
    code: 100008,
    patterns: [/^[A-Z]{2}\d{9}CN$/],
  },
  {
    name: 'Canada Post',
    code: 100013,
    patterns: [/^[A-Z]{2}\d{9}CA$/],
  },
  {
    name: 'Royal Mail',
    code: 100014,
    patterns: [/^[A-Z]{2}\d{9}GB$/],
  },
  {
    name: 'Australia Post',
    code: 100018,
    patterns: [/^[A-Z]{2}\d{9}AU$/],
  },
  {
    name: 'Singapore Post',
    code: 100020,
    patterns: [/^[A-Z]{2}\d{9}SG$/],
  },
  {
    name: 'USPS',
    code: 100001,
    patterns: [
      /^94\d{18}$/,
      /^92\d{18}$/,
      /^93\d{18}$/,
      /^[A-Z]{2}\d{9}US$/,
      /^EJ\d{17}$/,
    ],
  },
  {
    name: 'EMS',
    code: 100007,
    patterns: [/^E[A-Z]\d{9}[A-Z]{2}$/, /^[A-Z]{2}\d{9}[A-Z]{2}$/],
  },
  {
    name: 'UPS',
    code: 100002,
    patterns: [/^1Z[0-9A-Z]{16}$/, /^[A-Z]{2}\d{9}[A-Z]{2}$/],
  },
  {
    name: 'FedEx',
    code: 100003,
    patterns: [/^\d{12}$/, /^\d{15}$/, /^[0-9]{20}$/, /^61\d{17}$/],
  },
  {
    name: 'DHL',
    code: 100004,
    patterns: [/^\d{10}$/, /^[A-Z]{3}\d{7}$/, /^JD\d{18}$/, /^\d{20}$/],
  },
  {
    name: 'DHL Express',
    code: 100005,
    patterns: [/^\d{11}$/],
  },
];

/** Result of a carrier lookup. */
interface CarrierLookupResult {
  code: number;
  name: string;
}

/**
 * Resolves 17Track numeric carrier codes to human-readable names
 * and detects carriers from tracking number patterns.
 */
@Injectable()
export class TrackingCarrierService {
  /**
   * Look up the human-readable carrier name for a 17Track numeric code.
   *
   * @example
   *   getCarrierName(100002) // → 'UPS'
   *   getCarrierName(999999) // → 'Unknown (999999)'
   */
  getCarrierName(code: number): string {
    return CARRIER_CODE_MAP[code] || `Unknown (${code})`;
  }

  /**
   * Resolve a carrier name (case-insensitive) to a 17Track numeric code.
   *
   * @example
   *   getCarrierCode('UPS')          // → 100002
   *   getCarrierCode('DHL Express')  // → 100005
   */
  getCarrierCode(name: string): number | null {
    return CARRIER_NAME_TO_CODE[name.toLowerCase().trim()] ?? null;
  }

  /**
   * Attempt to detect the carrier from a tracking number by matching
   * against known regex patterns.
   *
   * Returns the first matching carrier, or `null` when no pattern
   * matches.
   *
   * @example
   *   detectCarrier('1Z999AA10123456784') // → { code: 100002, name: 'UPS' }
   */
  detectCarrier(trackingNumber: string): CarrierLookupResult | null {
    const trimmed = trackingNumber.trim().toUpperCase();

    for (const carrier of CARRIER_DETECTION_PATTERNS) {
      for (const pattern of carrier.patterns) {
        if (pattern.test(trimmed)) {
          return { code: carrier.code, name: carrier.name };
        }
      }
    }

    return null;
  }

  /**
   * Get the full list of known carrier codes and names.
   */
  getAllCarriers(): Array<CarrierLookupResult> {
    return Object.entries(CARRIER_CODE_MAP).map(([code, name]) => ({
      code: Number(code),
      name,
    }));
  }
}
