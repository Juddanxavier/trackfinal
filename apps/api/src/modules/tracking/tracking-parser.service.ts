import { Injectable, Logger } from '@nestjs/common';

const logger = new Logger('TrackingParser');

/** Normalised tracking data returned to the rest of the system. */
export interface TrackingData {
  trackingNumber: string;
  carrierCode: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'exception' | 'not_found';
  statusRaw: string;
  lastEvent: string | null;
  lastLocation: string | null;
  lastEventTime: string | null;
  originCountry: string | null;
  destinationCountry: string | null;
  events: Array<{
    status: string;
    statusRaw: string;
    description: string;
    location: string;
    eventTime: string;
  }>;
  rawData: Record<string, any>;
}

/**
 * Maps 17Track API status strings to the application's canonical
 * status enum.
 */
export const STATUS_MAP: Record<string, TrackingData['status']> = {
  NotFound: 'not_found',
  InfoReceived: 'pending',
  PickedUp: 'in_transit',
  InTransit: 'in_transit',
  Arrival: 'in_transit',
  Departure: 'in_transit',
  AvailableForPickup: 'in_transit',
  OutForDelivery: 'in_transit',
  Delivered: 'delivered',
  Returned: 'exception',
  Returning: 'exception',
  Exception: 'exception',
};

/**
 * ISO-3166-1 alpha-2 country codes mapped to full country names.
 */
const COUNTRY_MAP: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  AU: 'Australia',
  CA: 'Canada',
  JP: 'Japan',
  CN: 'China',
  SG: 'Singapore',
  AE: 'United Arab Emirates',
  NL: 'Netherlands',
  IT: 'Italy',
  ES: 'Spain',
  BR: 'Brazil',
  MX: 'Mexico',
};

/**
 * Pure functions and a thin wrapper for parsing and normalising
 * 17Track API responses into the application's `TrackingData` shape.
 */
@Injectable()
export class TrackingParserService {
  /**
   * Normalise a 17Track status value to the application's status enum.
   *
   * Falls back to `'in_transit'` for unrecognised statuses so that
   * unknown statuses from future API versions are treated as in-flight
   * rather than missing.
   */
  mapStatus(status?: string): TrackingData['status'] {
    if (!status) return 'not_found';
    return STATUS_MAP[status] || 'in_transit';
  }

  /**
   * Resolve a 2-letter ISO country code to its full English name.
   * Returns the original code when the mapping is unknown.
   */
  getCountryName(code: string): string {
    return COUNTRY_MAP[code?.toUpperCase()] || code || 'Unknown';
  }

  /**
   * Parse a raw 17Track tracking-info object into a normalised
   * `TrackingData` structure suitable for internal consumers.
   *
   * Handles both the top-level `latest_event` / `latest_status`
   * fields and the nested provider-event list under `tracking`.
   *
   * @param accepted  The accepted item from a 17Track API response.
   * @param carrierCode  Optional fallback carrier code string.
   */
  parseTrackingResponse(accepted: any, carrierCode?: string): TrackingData {
    const trackInfo = accepted.track_info || accepted;
    const tracking = trackInfo?.tracking?.providers?.[0];
    const latestEvent = trackInfo?.latest_event;
    const shippingInfo = trackInfo?.shipping_info;

    const status = this.mapStatus(
      trackInfo?.latest_status?.status ||
        trackInfo?.status ||
        tracking?.events?.[0]?.stage ||
        'InfoReceived',
    );
    const statusRaw =
      trackInfo?.latest_status?.status ||
      trackInfo?.status ||
      tracking?.events?.[0]?.stage ||
      'Unknown';

    const events = (tracking?.events || []).map((event: any) => {
      const address = event.address;
      const eventLocation =
        event.location ||
        (address?.city
          ? `${address.city}, ${address.state}, ${address.country}`
          : '');
      return {
        status: this.mapStatus(event.stage || event.sub_status || 'InTransit'),
        statusRaw: event.stage || event.sub_status || 'InTransit',
        description: event.description || '',
        location: eventLocation,
        eventTime: event.time_utc
          ? new Date(event.time_utc).toISOString()
          : new Date().toISOString(),
      };
    });

    const originCountry = shippingInfo?.shipper_address?.country
      ? this.getCountryName(shippingInfo.shipper_address.country)
      : null;
    const destinationCountry = shippingInfo?.recipient_address?.country
      ? this.getCountryName(shippingInfo.recipient_address.country)
      : null;

    const carrierId = accepted.carrier?.toString() || carrierCode || '';

    return {
      trackingNumber: accepted.number,
      carrierCode: carrierId,
      status,
      statusRaw,
      lastEvent: latestEvent?.description || events[0]?.description || null,
      lastLocation: latestEvent?.location || events[0]?.location || null,
      lastEventTime: latestEvent?.time_utc
        ? new Date(latestEvent.time_utc).toISOString()
        : events[0]?.eventTime || null,
      originCountry,
      destinationCountry,
      events,
      rawData: trackInfo || {},
    };
  }

  /**
   * Parse the `latest_status` sub-object into a simplified status
   * string and its raw counterpart.
   */
  parseLatestStatus(statusObj: {
    status?: string;
    sub_status?: string;
    sub_status_descr?: string;
  }): {
    status: TrackingData['status'];
    statusRaw: string;
    description: string;
  } {
    const raw = statusObj?.status || 'InfoReceived';
    return {
      status: this.mapStatus(raw),
      statusRaw: raw,
      description: statusObj?.sub_status_descr || '',
    };
  }
}
