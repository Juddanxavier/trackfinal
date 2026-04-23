export interface TrackingEvent {
  date: string;
  status: string;
  location?: string;
  description: string;
}

export interface TrackingData {
  trackingNumber: string;
  carrierCode: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'exception' | 'returned';
  origin?: string;
  destination?: string;
  events: TrackingEvent[];
  estimatedDelivery?: string;
  rawData?: any;
  pending?: boolean;
  pendingMessage?: string;
}

export interface ITrackingProvider {
  readonly name: string;

  track(
    carrierCode: string,
    trackingNumber: string,
  ): Promise<TrackingData | null>;

  detectCarrier(
    trackingNumber: string,
  ): Promise<{ carrierCode: string; confidence: number } | null>;

  subscribe?(
    carrierCode: string,
    trackingNumber: string,
    webhookUrl: string,
  ): Promise<boolean>;

  parseWebhook?(
    payload: any,
  ): { carrierCode: string; trackingNumber: string; data: TrackingData } | null;

  getSupportedCarriers(): string[];

  normalizeStatus(
    status: string,
  ): 'pending' | 'in_transit' | 'delivered' | 'exception' | 'returned';
}
