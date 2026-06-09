import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { db } from '../../database';
import { trackingApiRateLimits } from '../../database/schema/tracking';
import { eq, sql } from 'drizzle-orm';

const logger = new Logger('TrackingRateLimiter');

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: Date;
}

/**
 * Manages per-endpoint rate limiting for the 17Track API.
 * Tracks request counts in-memory and persists them to the database
 * so limits survive service restarts.
 */
@Injectable()
export class TrackingRateLimiter {
  private rateLimits: Record<string, RateLimitConfig> = {
    register: { maxRequests: 100, windowMs: 60000 },
    gettrackinfo: { maxRequests: 500, windowMs: 60000 },
  };

  private requestCounts: Map<string, RateLimitRecord> = new Map();

  constructor(private configService: ConfigService) {
    this.loadRateLimitsFromDb();
  }

  /**
   * Load persisted rate-limit records from the database on startup
   * so counters survive process restarts.
   */
  private async loadRateLimitsFromDb() {
    try {
      const apiKey = this.configService.get<string>('SEVENTEEN_API_KEY') || '';
      const limits = await db
        .select()
        .from(trackingApiRateLimits)
        .where(eq(trackingApiRateLimits.apiKey, apiKey));

      for (const limit of limits) {
        this.requestCounts.set(limit.endpoint, {
          count: limit.requestCount,
          resetAt: new Date(limit.windowEnd),
        });
      }
    } catch (err) {
      logger.warn('Failed to load rate limits from DB, using defaults');
    }
  }

  /**
   * Check whether a request to the given endpoint is allowed.
   * Returns `false` when the rate window is exhausted, along with a
   * warning log containing the required wait time.
   */
  async checkRateLimit(endpoint: string): Promise<boolean> {
    const limit = this.rateLimits[endpoint];
    if (!limit) return true;

    const now = new Date();
    let record = this.requestCounts.get(endpoint);

    if (!record || now >= record.resetAt) {
      record = { count: 0, resetAt: new Date(now.getTime() + limit.windowMs) };
      this.requestCounts.set(endpoint, record);
    }

    if (record.count >= limit.maxRequests) {
      const waitTime = record.resetAt.getTime() - now.getTime();
      logger.warn(`Rate limit reached for ${endpoint}, waiting ${waitTime}ms`);
      return false;
    }

    record.count++;
    await this.recordRequest(endpoint);
    return true;
  }

  /**
   * Persist the current request count to the database via upsert so
   * concurrent instances stay roughly synchronised.
   */
  private async recordRequest(endpoint: string) {
    try {
      const apiKey = this.configService.get<string>('SEVENTEEN_API_KEY') || '';
      await db
        .insert(trackingApiRateLimits)
        .values({
          apiKey,
          endpoint,
          requestCount: 1,
          windowStart: new Date(),
          windowEnd: new Date(Date.now() + 60000),
        })
        .onConflictDoUpdate({
          target: [
            trackingApiRateLimits.apiKey,
            trackingApiRateLimits.endpoint,
          ],
          set: {
            requestCount: sql`${trackingApiRateLimits.requestCount} + 1`,
            windowStart: new Date(),
            windowEnd: new Date(Date.now() + 60000),
          },
        });
    } catch (err) {
      logger.debug('Failed to record API request');
    }
  }

  /**
   * Get the current rate-limit configuration for all tracked endpoints.
   */
  getLimits(): Record<string, RateLimitConfig> {
    return { ...this.rateLimits };
  }

  /**
   * Override the default rate-limit configuration at runtime.
   */
  setLimits(limits: Partial<Record<string, RateLimitConfig>>): void {
    Object.assign(this.rateLimits, limits);
  }

  /**
   * Reset the in-memory counter for a single endpoint (used after a
   * rate-limit back-off has been observed to have passed).
   */
  resetEndpoint(endpoint: string): void {
    this.requestCounts.delete(endpoint);
  }
}
