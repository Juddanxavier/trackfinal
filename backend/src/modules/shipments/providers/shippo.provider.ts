import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ITrackingProvider,
  TrackingData,
  TrackingEvent,
} from '../interfaces/tracking-provider.interface';
import { getCarrierCode } from '../carriers-mapping';

@Injectable()
export class ShippoProvider implements ITrackingProvider {
  readonly name = 'shippo';

  private apiKey: string;
  private apiUrl = 'https://api.goshippo.com';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('SHIPPO_API_KEY') || '';
  }

  async track(
    carrierCode: string,
    trackingNumber: string,
  ): Promise<TrackingData | null> {
    if (!this.apiKey) {
      console.warn('SHIPPO_API_KEY not configured');
      return null;
    }

    try {
      const carrier = this.mapCarrierCode(carrierCode);
      const response = await fetch(
        `${this.apiUrl}/tracks/${carrier}/${trackingNumber}`,
        {
          method: 'GET',
          headers: {
            Authorization: `ShippoToken ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Shippo API error: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeResponse(trackingNumber, carrierCode, data);
    } catch (error) {
      console.error('Shippo track error:', error);
      return null;
    }
  }

  async detectCarrier(
    trackingNumber: string,
  ): Promise<{ carrierCode: string; confidence: number } | null> {
    if (!this.apiKey) {
      console.warn('SHIPPO_API_KEY not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `ShippoToken ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tracking_number: trackingNumber }),
      });

      if (!response.ok) {
        throw new Error(`Shippo detect API error: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeDetection(trackingNumber, data);
    } catch (error) {
      console.error('Shippo detect error:', error);
      return null;
    }
  }

  async subscribe(
    carrierCode: string,
    trackingNumber: string,
    webhookUrl: string,
  ): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('SHIPPO_API_KEY not configured');
      return false;
    }

    try {
      const carrier = this.mapCarrierCode(carrierCode);
      const response = await fetch(
        `${this.apiUrl}/tracks/${carrier}/${trackingNumber}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `ShippoToken ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            webhook_url: webhookUrl,
          }),
        },
      );

      return response.ok;
    } catch (error) {
      console.error('Shippo subscribe error:', error);
      return false;
    }
  }

  parseWebhook(payload: any): {
    carrierCode: string;
    trackingNumber: string;
    data: TrackingData;
  } | null {
    try {
      const { tracking_status, tracking_number, carrier } = payload;
      if (!tracking_number || !carrier) return null;

      const trackingData = this.normalizeResponse(
        tracking_number,
        carrier,
        payload,
      );
      if (!trackingData) return null;
      return {
        carrierCode: carrier,
        trackingNumber: tracking_number,
        data: trackingData,
      };
    } catch (error) {
      console.error('Shippo webhook parse error:', error);
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
      'amazon',
      'ontrac',
      'lasership',
      'australia_post',
      'canada_post',
      'royal_mail',
      'parcelforce',
      'postnl',
      'dpd',
      'hermes',
      'mondialrelay',
      'china_post',
      'yun_express',
      '4px',
      'sf_express',
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
      s.includes('lost') ||
      s.includes('return')
    )
      return 'exception';
    if (
      s.includes('transit') ||
      s.includes('shipped') ||
      s.includes('departed') ||
      s.includes('pickup') ||
      s.includes('in_progress') ||
      s.includes('pre_transit')
    )
      return 'in_transit';
    return 'pending';
  }

  private mapCarrierCode(code: string): string {
    const carrierMap: Record<string, string> = {
      usps: 'usps',
      ups: 'ups',
      fedex: 'fedex',
      dhl: 'dhl_express',
      dhl_express: 'dhl_express',
      amazon: 'amazon',
      ontrac: 'ontrac',
      lasership: 'lasership',
      australia_post: 'australia_post',
      auspost: 'australia_post',
      canada_post: 'canada_post',
      canadapost: 'canada_post',
      royal_mail: 'royal_mail',
      parcelforce: 'parcelforce',
      postnl: 'postnl',
      dpd: 'dpd',
      hermes: 'hermes',
      mondialrelay: 'mondialrelay',
      china_post: 'china_post',
      yun_express: 'yun_express',
      '4px': '4px',
      sf_express: 'sf_express',
    };
    return carrierMap[code.toLowerCase()] || code;
  }

  private normalizeResponse(
    trackingNumber: string,
    carrierCode: string,
    response: any,
  ): TrackingData | null {
    try {
      const status = response?.tracking_status;
      if (!status) return null;

      const events: TrackingEvent[] = (response?.history || []).map(
        (e: any) => ({
          date: e.datetime || e.status_date,
          status: e.status,
          location: e.location?.city
            ? `${e.location.city}, ${e.location.state} ${e.location.country}`
            : e.location,
          description: e.status_details || e.status,
        }),
      );

      return {
        trackingNumber,
        carrierCode,
        status: this.normalizeStatus(status?.status || ''),
        origin: response?.address_from?.city
          ? `${response.address_from.city}, ${response.address_from.country}`
          : undefined,
        destination: response?.address_to?.city
          ? `${response.address_to.city}, ${response.address_to.country}`
          : undefined,
        events,
        estimatedDelivery: response?.eta,
        rawData: response,
      };
    } catch (error) {
      console.error('Shippo normalize error:', error);
      return null;
    }
  }

  private normalizeDetection(
    trackingNumber: string,
    response: any,
  ): { carrierCode: string; confidence: number } | null {
    try {
      const carrier = response?.carrier;
      if (!carrier) return null;

      return {
        carrierCode: carrier,
        confidence: 0.9,
      };
    } catch (error) {
      return null;
    }
  }
}
