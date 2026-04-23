import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ITrackingProvider,
  TrackingData,
  TrackingEvent,
} from '../interfaces/tracking-provider.interface';
import { getCarrierCode } from '../carriers-mapping';

@Injectable()
export class TrackingMoreProvider implements ITrackingProvider {
  readonly name = 'trackingmore';

  private apiKey: string;
  private apiUrl = 'https://api.trackingmore.com/v2';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('TRACKINGMORE_API_KEY') || '';
  }

  async track(
    carrierCode: string,
    trackingNumber: string,
  ): Promise<TrackingData | null> {
    if (!this.apiKey) {
      console.warn('TRACKINGMORE_API_KEY not configured');
      return null;
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/trackings/${carrierCode}/${trackingNumber}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Trackingmore-Api-Key': this.apiKey,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`TrackingMore API error: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeResponse(trackingNumber, carrierCode, data);
    } catch (error) {
      console.error('TrackingMore track error:', error);
      return null;
    }
  }

  async detectCarrier(
    trackingNumber: string,
  ): Promise<{ carrierCode: string; confidence: number } | null> {
    if (!this.apiKey) {
      console.warn('TRACKINGMORE_API_KEY not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Trackingmore-Api-Key': this.apiKey,
        },
        body: JSON.stringify({ tracking_number: trackingNumber }),
      });

      if (!response.ok) {
        throw new Error(`TrackingMore detect API error: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeDetection(trackingNumber, data);
    } catch (error) {
      console.error('TrackingMore detect error:', error);
      return null;
    }
  }

  async subscribe(
    carrierCode: string,
    trackingNumber: string,
    webhookUrl: string,
  ): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('TRACKINGMORE_API_KEY not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/trackings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Trackingmore-Api-Key': this.apiKey,
        },
        body: JSON.stringify({
          tracking_number: trackingNumber,
          carrier_code: carrierCode,
          webhook_url: webhookUrl,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('TrackingMore subscribe error:', error);
      return false;
    }
  }

  parseWebhook(payload: any): {
    carrierCode: string;
    trackingNumber: string;
    data: TrackingData;
  } | null {
    try {
      const {
        tracking_number,
        carrier_code,
        last_event,
        origin_info,
        destination_info,
      } = payload;
      if (!tracking_number || !carrier_code) return null;

      const trackingData = this.normalizeResponse(
        tracking_number,
        carrier_code,
        {
          data: { last_event, origin_info, destination_info },
        },
      );
      if (!trackingData) return null;
      return {
        carrierCode: carrier_code,
        trackingNumber: tracking_number,
        data: trackingData,
      };
    } catch (error) {
      console.error('TrackingMore webhook parse error:', error);
      return null;
    }
  }

  getSupportedCarriers(): string[] {
    return [
      'usps',
      'ups',
      'fedex',
      'dhl',
      'dhl_express',
      'dhl_global_mail',
      'amazon',
      'ontrac',
      'lasership',
      'australia_post',
      'auspost',
      'canada_post',
      'canadapost',
      'royal_mail',
      'parcelforce',
      'poste_italiane',
      'deutsche_post',
      'dpd',
      'hermes',
      'china_post',
      'china_ems',
      'yun_express',
      'sf_express',
      'japan_post',
      'korea_post',
      'malaysia_post',
      'singpost',
    ];
  }

  normalizeStatus(
    status: string,
  ): 'pending' | 'in_transit' | 'delivered' | 'exception' | 'returned' {
    const s = status.toLowerCase();
    if (s.includes('delivered')) return 'delivered';
    if (s.includes('return')) return 'returned';
    if (
      s.includes('exception') ||
      s.includes('fail') ||
      s.includes('error') ||
      s.includes('lost')
    )
      return 'exception';
    if (
      s.includes('transit') ||
      s.includes('shipped') ||
      s.includes('departed') ||
      s.includes('pickup') ||
      s.includes('arrived')
    )
      return 'in_transit';
    return 'pending';
  }

  private normalizeResponse(
    trackingNumber: string,
    carrierCode: string,
    response: any,
  ): TrackingData | null {
    try {
      const info = response?.data?.last_event || response?.data;
      if (!info) return null;

      const events: TrackingEvent[] = (
        response?.data?.origin_info?.trackinfo || []
      ).map((e: any) => ({
        date: e.Date,
        status: e.Status,
        location: e.Location,
        description: e.StatusDescription,
      }));

      return {
        trackingNumber,
        carrierCode,
        status: this.normalizeStatus(info.Status || ''),
        origin: response?.data?.origin_info?.ShippedLocation || info.origin,
        destination:
          response?.data?.destination_info?.DeliveryLocation ||
          info.destination,
        events,
        estimatedDelivery: response?.data?.expected_delivery,
        rawData: response,
      };
    } catch (error) {
      console.error('TrackingMore normalize error:', error);
      return null;
    }
  }

  private normalizeDetection(
    trackingNumber: string,
    response: any,
  ): { carrierCode: string; confidence: number } | null {
    try {
      const detection = response?.data?.[0];
      if (!detection) return null;

      return {
        carrierCode: detection.carrier_code || detection.code,
        confidence: detection.rate || 0.7,
      };
    } catch (error) {
      return null;
    }
  }
}
