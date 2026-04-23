import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ITrackingProvider,
  TrackingData,
  TrackingEvent,
} from '../interfaces/tracking-provider.interface';
import { getCarrierCode } from '../carriers-mapping';

@Injectable()
export class Track17Provider implements ITrackingProvider {
  readonly name = 'track17';

  private apiToken: string;
  private baseUrl = 'https://api.17track.net/track/v2';

  constructor(private configService: ConfigService) {
    this.apiToken = this.configService.get('TRACK17_API_KEY') || '';
  }

  async track(
    carrierCode: string,
    trackingNumber: string,
  ): Promise<TrackingData | null> {
    if (!this.apiToken) {
      console.warn('TRACK17_API_KEY not configured');
      return null;
    }

    try {
      const normalizedCarrier = this.normalizeCarrierCode(carrierCode);
      console.log(
        `[Track17] Getting tracking for ${trackingNumber} with carrier ${normalizedCarrier}`,
      );

      // First try to get existing tracking info (avoids re-registration)
      const getInfoResponse = await fetch(`${this.baseUrl}/gettrackinfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '17token': this.apiToken,
        },
        body: JSON.stringify([
          { number: trackingNumber, carrier: normalizedCarrier },
        ]),
      });

      const getInfoText = await getInfoResponse.text();

      // Check if response is HTML (error page)
      if (getInfoText.trim().startsWith('<')) {
        console.error(`[Track17] API returned HTML instead of JSON (status ${getInfoResponse.status}). This usually means an invalid API key or endpoint issue.`);
        return null;
      }

      if (getInfoResponse.ok) {
        try {
          const getInfoData = JSON.parse(getInfoText);
          const result = this.normalizeResponse(
            trackingNumber,
            carrierCode,
            getInfoData,
          );
          if (result) {
            console.log(`[Track17] Got tracking info successfully`);
            return result;
          }
        } catch (parseError) {
          console.error(`[Track17] Failed to parse JSON response:`, getInfoText.substring(0, 200));
          return null;
        }
      }

      // If no data, try registering
      console.log(`[Track17] No existing tracking, registering...`);
      const registerResponse = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '17token': this.apiToken,
        },
        body: JSON.stringify([
          { number: trackingNumber, carrier: normalizedCarrier },
        ]),
      });

      const registerText = await registerResponse.text();

      // Check if response is HTML (error page)
      if (registerText.trim().startsWith('<')) {
        console.error(`[Track17] API returned HTML instead of JSON (status ${registerResponse.status}). This usually means an invalid API key or endpoint issue.`);
        return null;
      }

      if (!registerResponse.ok) {
        console.error(`[Track17] Register error: ${registerResponse.status} - ${registerText.substring(0, 200)}`);
        return null;
      }

      try {
        const registerData = JSON.parse(registerText);
        return this.normalizeResponse(trackingNumber, carrierCode, registerData);
      } catch (parseError) {
        console.error(`[Track17] Failed to parse register response:`, registerText.substring(0, 200));
        return null;
      }
    } catch (error) {
      console.error('Track17 track error:', error);
      return null;
    }
  }

  async detectCarrier(
    trackingNumber: string,
  ): Promise<{ carrierCode: string; confidence: number } | null> {
    if (!this.apiToken) {
      console.warn('TRACK17_API_KEY not configured');
      return null;
    }

    try {
      console.log(`[Track17] Auto-detecting carrier for ${trackingNumber}`);

      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '17token': this.apiToken,
        },
        body: JSON.stringify([{ number: trackingNumber, carrier: null }]),
      });

      const responseText = await response.text();

      // Check if response is HTML (error page)
      if (responseText.trim().startsWith('<')) {
        console.error(`[Track17] API returned HTML instead of JSON (status ${response.status}). This usually means an invalid API key or endpoint issue.`);
        return null;
      }

      console.log(`[Track17] Detect Response status: ${response.status}`);
      console.log(`[Track17] Detect Response body: ${responseText.substring(0, 200)}`);

      if (!response.ok) {
        console.error(`[Track17] Detect API error: ${response.status}`);
        return null;
      }

      try {
        const data = JSON.parse(responseText);
        return this.normalizeDetection(trackingNumber, data);
      } catch (parseError) {
        console.error(`[Track17] Failed to parse detect response:`, responseText.substring(0, 200));
        return null;
      }
    } catch (error) {
      console.error('Track17 detect error:', error);
      return null;
    }
  }

  async subscribe(
    carrierCode: string,
    trackingNumber: string,
    webhookUrl: string,
  ): Promise<boolean> {
    if (!this.apiToken) {
      console.warn('TRACK17_API_KEY not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '17token': this.apiToken,
        },
        body: JSON.stringify([
          {
            number: trackingNumber,
            carrier: this.normalizeCarrierCode(carrierCode),
            tag: webhookUrl,
          },
        ]),
      });

      return response.ok;
    } catch (error) {
      console.error('Track17 subscribe error:', error);
      return false;
    }
  }

  parseWebhook(payload: string): {
    carrierCode: string;
    trackingNumber: string;
    data: TrackingData;
  } | null {
    try {
      const parsed = JSON.parse(payload);
      const { event, data } = parsed;

      if (event === 'TRACKING_UPDATED' || event === 'TRACKING_STOP') {
        const { number, carrier, tracking } = data;
        if (!number || !tracking) return null;

        const trackingData = this.normalizeResponse(
          number,
          carrier?.toString(),
          { data: { tracking } },
        );
        if (!trackingData) return null;
        return {
          carrierCode: carrier?.toString(),
          trackingNumber: number,
          data: trackingData,
        };
      }

      return null;
    } catch (error) {
      console.error('Track17 webhook parse error:', error);
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
      'poste_italiane',
      'deutsche_post',
      'china_post',
      'yun_express',
    ];
  }

  normalizeStatus(
    status: string,
    subStatus?: string,
  ): 'pending' | 'in_transit' | 'delivered' | 'exception' | 'returned' {
    const s = (status || '').toLowerCase();
    const ss = (subStatus || '').toLowerCase();

    if (s.includes('delivered')) return 'delivered';
    if (s.includes('return')) return 'returned';
    if (
      s.includes('exception') ||
      s.includes('fail') ||
      s.includes('error') ||
      ss.includes('exception')
    )
      return 'exception';
    if (
      s.includes('transit') ||
      s.includes('shipped') ||
      s.includes('departed') ||
      s.includes('arrived') ||
      s.includes('pickup')
    )
      return 'in_transit';
    return 'pending';
  }

  private normalizeCarrierCode(carrierCode: string): string | null {
    if (!carrierCode) return null;

    const mappedCode = getCarrierCode(carrierCode);
    if (mappedCode) {
      return mappedCode;
    }

    console.log(`[Track17] Unknown carrier code: ${carrierCode}`);
    return carrierCode;
  }

  private normalizeResponse(
    trackingNumber: string,
    carrierCode: string | number,
    response: any,
  ): TrackingData | null {
    try {
      // Handle both register and gettrackinfo response formats
      let acceptedItem = response?.data?.accepted?.[0];

      // For gettrackinfo, the tracking might be directly in data
      if (!acceptedItem && response?.data?.tracking) {
        acceptedItem = {
          number: trackingNumber,
          carrier: carrierCode,
          tracking: response.data,
        };
      }

      // Also check for accepted array in gettrackinfo format
      if (
        !acceptedItem &&
        Array.isArray(response?.data) &&
        response.data.length > 0
      ) {
        acceptedItem = response.data[0];
      }

      if (!acceptedItem) {
        console.log(`[Track17] No accepted item for ${trackingNumber}`);
        return null;
      }

      const detectedCarrierCode =
        acceptedItem.carrier?.toString() || carrierCode?.toString() || '';
      const tracking = acceptedItem?.tracking || acceptedItem;
      const latestStatus = tracking?.latest_status || tracking?.status;
      const providers = tracking?.providers?.[0] || tracking;

      const events: TrackingEvent[] = providers?.events
        ? providers.events.map((e: any) => ({
            date: e.time_raw || e.time,
            status: e.status,
            location: e.location?.city
              ? `${e.location.city}, ${e.location.country}`
              : e.location?.country,
            description: e.status_description || e.description,
          }))
        : [];

      const status = latestStatus?.status
        ? this.normalizeStatus(latestStatus.status, latestStatus.sub_status)
        : events.length === 0
          ? 'pending'
          : 'in_transit';

      if (events.length === 0) {
        console.log(
          `[Track17] No events found for ${trackingNumber} - likely pending first scan`,
        );
      }

      return {
        trackingNumber,
        carrierCode: carrierCode?.toString() || detectedCarrierCode,
        status,
        origin: tracking?.origin_info?.ShippedLocation || providers?.origin,
        destination:
          tracking?.destination_info?.DeliveryLocation ||
          providers?.destination,
        events,
        estimatedDelivery: tracking?.estimate_delivery?.date,
        rawData: response,
        pending: events.length === 0,
        pendingMessage:
          events.length === 0 ? 'Awaiting first carrier scan' : undefined,
      };
    } catch (error) {
      console.error('Track17 normalize error:', error);
      return null;
    }
  }

  private normalizeDetection(
    trackingNumber: string,
    response: any,
  ): { carrierCode: string; confidence: number } | null {
    try {
      const accepted = response?.data?.accepted?.[0];
      const rejected = response?.data?.rejected?.[0];

      if (accepted) {
        return {
          carrierCode: accepted.carrier?.toString() || '',
          confidence: 0.8,
        };
      }

      if (rejected) {
        const errorCode = rejected?.error?.code;
        const errorMsg = rejected?.error?.message || '';

        if (
          errorCode === -18019903 ||
          errorMsg.includes('cannot be detected')
        ) {
          console.log(
            `[Track17] Carrier cannot be detected for ${trackingNumber}`,
          );
        } else {
          console.log(
            `[Track17] Registration rejected for ${trackingNumber}: ${errorMsg}`,
          );
        }
        return null;
      }

      return null;
    } catch (error) {
      console.error('[Track17] normalizeDetection error:', error);
      return null;
    }
  }
}
