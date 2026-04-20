import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Track17Service {
  private apiKey: string;
  private apiUrl = 'https://api.17track.net/api/v2.0/track';
  private detectUrl = 'https://api.17track.net/api/v2.0/detect';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('TRACK17_API_KEY') || '';
  }

  async track(carrierCode: string, trackingNumber: string): Promise<any> {
    if (!this.apiKey) {
      console.warn('TRACK17_API_KEY not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            number: trackingNumber,
            carrier: carrierCode,
          },
        ]),
      });

      if (!response.ok) {
        throw new Error(`Track17 API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Track17 track error:', error);
      return null;
    }
  }

  async detectCarrier(trackingNumber: string): Promise<any> {
    if (!this.apiKey) {
      console.warn('TRACK17_API_KEY not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.detectUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ number: trackingNumber }]),
      });

      if (!response.ok) {
        throw new Error(`Track17 detect API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Track17 detect error:', error);
      return null;
    }
  }
}