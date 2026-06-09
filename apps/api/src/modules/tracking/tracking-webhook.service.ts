import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from '../../common/utils/crypto.util';

const logger = new Logger('TrackingWebhookService');

/** Shape of a single item in a 17Track webhook payload array. */
export interface SeventeenTrackWebhookItem {
  number: string;
  carrier: number;
  tag?: string;
  token?: string;
  webhook_token?: string;
  track_info?: Record<string, any>;
}

/** Normalised webhook event after transformation. */
export interface NormalisedWebhookEvent {
  trackingNumber: string;
  carrierCode: string;
  status: string;
  description: string | null;
  location: string | null;
  eventTime: string | null;
  raw: Record<string, any>;
}

/** Result returned after processing a batch of webhook payloads. */
export interface WebhookProcessResult {
  processed: number;
  valid: number;
  invalid: number;
  errors: string[];
}

/**
 * Handles 17Track webhook payload verification, transformation,
 * and normalisation before the payload is forwarded to the sync
 * service for persistence.
 */
@Injectable()
export class TrackingWebhookService {
  constructor(private configService: ConfigService) {}

  /**
   * Verify that the incoming webhook payload carries a valid token.
   * Uses timing-safe comparison to prevent timing attacks.
   *
   * The expected token is read from `SEVENTEEN_WEBHOOK_TOKEN`.  When
   * no token is configured verification is skipped (pass-through).
   *
   * @returns `true` when the payload is authentic, `false` otherwise.
   */
  verifyPayload(payload: SeventeenTrackWebhookItem[]): boolean {
    const expectedToken = this.configService.get<string>(
      'SEVENTEEN_WEBHOOK_TOKEN',
    );

    if (!expectedToken) {
      logger.warn(
        'No SEVENTEEN_WEBHOOK_TOKEN configured — skipping verification',
      );
      return true;
    }

    const providedToken = payload[0]?.token || payload[0]?.webhook_token || '';

    if (!providedToken) {
      logger.warn('Webhook payload missing token');
      return false;
    }

    return timingSafeEqual(providedToken, expectedToken);
  }

  /**
   * Transform a raw 17Track webhook payload into an array of
   * normalised internal event objects.
   *
   * Strips sensitive fields (token, webhook_token) and flattens
   * the nested tracking structure into a consistent shape.
   */
  transformPayload(
    payload: SeventeenTrackWebhookItem[],
  ): NormalisedWebhookEvent[] {
    return payload.map((item) => {
      const trackInfo = item.track_info || {};
      const latestEvent = trackInfo.latest_event as
        | Record<string, any>
        | undefined;
      const latestStatus = trackInfo.latest_status as
        | Record<string, any>
        | undefined;

      return {
        trackingNumber: item.number,
        carrierCode: String(item.carrier),
        status: latestStatus?.status || 'InfoReceived',
        description: latestEvent?.description || null,
        location: latestEvent?.location || null,
        eventTime: latestEvent?.time_utc || null,
        raw: trackInfo,
      };
    });
  }

  /**
   * Process a batch of raw webhook payload items: verify
   * authenticity, transform, and return the result.
   *
   * Invalid (unauthenticated) payloads are counted but do not
   * halt processing of the rest of the batch.
   */
  processBatch(payload: SeventeenTrackWebhookItem[]): {
    events: NormalisedWebhookEvent[];
    result: WebhookProcessResult;
  } {
    if (!Array.isArray(payload) || payload.length === 0) {
      return {
        events: [],
        result: {
          processed: 0,
          valid: 0,
          invalid: 0,
          errors: ['Empty payload'],
        },
      };
    }

    if (!this.verifyPayload(payload)) {
      return {
        events: [],
        result: {
          processed: payload.length,
          valid: 0,
          invalid: payload.length,
          errors: ['Webhook token mismatch'],
        },
      };
    }

    const events = this.transformPayload(payload);

    logger.log(
      `Webhook batch: ${events.length} events from ${payload.length} items`,
    );

    return {
      events,
      result: {
        processed: payload.length,
        valid: events.length,
        invalid: 0,
        errors: [],
      },
    };
  }
}
