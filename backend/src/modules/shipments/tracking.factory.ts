import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITrackingProvider } from './interfaces/tracking-provider.interface';
import { Track17Provider } from './providers/track17.provider';
import { TrackingMoreProvider } from './providers/tracking-more.provider';
import { ShippoProvider } from './providers/shippo.provider';

@Injectable()
export class TrackingProviderFactory {
  private provider: ITrackingProvider;
  private providerName: string;

  constructor(
    private configService: ConfigService,
    private track17Provider: Track17Provider,
    private trackingMoreProvider: TrackingMoreProvider,
    private shippoProvider: ShippoProvider,
  ) {
    this.providerName =
      this.configService.get('TRACKING_PROVIDER') || 'track17';
    this.provider = this.selectProvider(this.providerName);
  }

  getProvider(): ITrackingProvider {
    return this.provider;
  }

  getProviderName(): string {
    return this.providerName;
  }

  switchProvider(name: string): ITrackingProvider {
    this.providerName = name;
    this.provider = this.selectProvider(name);
    console.log(`[TrackingFactory] Switched to provider: ${name}`);
    return this.provider;
  }

  getAvailableProviders(): string[] {
    return ['track17', 'trackingmore', 'shippo'];
  }

  async trackWithRetry(
    carrierCode: string,
    trackingNumber: string,
    maxRetries = 3,
  ): Promise<any> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.provider.track(carrierCode, trackingNumber);
        return result;
      } catch (error: any) {
        lastError = error;
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.warn(
          `[TrackingFactory] track attempt ${attempt}/${maxRetries} failed for ${trackingNumber}, retrying in ${delay}ms:`,
          error?.message || error,
        );
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    console.error(
      `[TrackingFactory] All ${maxRetries} retries exhausted for ${trackingNumber}:`,
      lastError?.message || lastError,
    );
    return null;
  }

  async detectCarrierWithRetry(
    trackingNumber: string,
    maxRetries = 3,
  ): Promise<any> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.provider.detectCarrier(trackingNumber);
        return result;
      } catch (error: any) {
        lastError = error;
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.warn(
          `[TrackingFactory] detectCarrier attempt ${attempt}/${maxRetries} failed for ${trackingNumber}, retrying in ${delay}ms:`,
          error?.message || error,
        );
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    console.error(
      `[TrackingFactory] All ${maxRetries} retries exhausted for ${trackingNumber}:`,
      lastError?.message || lastError,
    );
    return null;
  }

  private selectProvider(name: string): ITrackingProvider {
    switch (name.toLowerCase()) {
      case 'track17':
        return this.track17Provider;
      case 'trackingmore':
        return this.trackingMoreProvider;
      case 'shippo':
        return this.shippoProvider;
      default:
        console.warn(
          `[TrackingFactory] Unknown provider: ${name}, defaulting to track17`,
        );
        return this.track17Provider;
    }
  }
}
