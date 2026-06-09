import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { db } from '../../database';
import {
  trackingJobs,
  trackingJobEvents,
  trackingSettings,
  trackingTransLog,
} from '../../database/schema/tracking';
import { eq, and, asc, sql, or, isNull } from 'drizzle-orm';
import {
  CircuitBreaker,
  CircuitBreakerRegistry,
} from '../../common/utils/circuit-breaker';
import { TrackingRateLimiter } from './tracking-rate-limiter';
import { TrackingParserService, TrackingData } from './tracking-parser.service';

const logger = new Logger('SeventeenTrack');

interface RegisterResponse {
  code: number;
  data: {
    accepted?: Array<{ number: string; carrier: number; tag: string }>;
    rejected?: Array<{
      number: string;
      error: { code: number; message: string };
    }>;
  };
}

interface GetTrackacesResponse {
  code: number;
  data: {
    accepted?: Array<{
      number: string;
      carrier: number;
      track_info?: {
        shipping_info?: {
          shipper_address?: { country?: string; state?: string; city?: string };
          recipient_address?: {
            country?: string;
            state?: string;
            city?: string;
          };
        };
        latest_status?: {
          status?: string;
          sub_status?: string;
          sub_status_descr?: string;
        };
        latest_event?: {
          time_iso?: string;
          time_utc?: string;
          description?: string;
          location?: string;
          stage?: string;
          address?: {
            country?: string;
            state?: string;
            city?: string;
            postal_code?: string;
          };
        };
        tracking?: {
          providers?: Array<{
            provider?: { key: number; name: string };
            events?: Array<{
              time_iso?: string;
              time_utc?: string;
              description?: string;
              location?: string;
              stage?: string;
              sub_status?: string;
              address?: {
                country?: string;
                state?: string;
                city?: string;
                postal_code?: string;
              };
            }>;
          }>;
        };
      };
    }>;
    rejected?: Array<{
      number: string;
      error: { code: number; message: string };
    }>;
  };
}

export interface RegisterResult {
  trackingNumber: string;
  carrierCode: string;
  success: boolean;
  error?: string;
}

@Injectable()
export class SeventeenTrackService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.17track.net/track/v2.4';
  private circuitBreaker: CircuitBreaker;

  constructor(
    private configService: ConfigService,
    private rateLimiter: TrackingRateLimiter,
    private parser: TrackingParserService,
  ) {
    this.apiKey = this.configService.get<string>('SEVENTEEN_API_KEY') || '';
    if (!this.apiKey) {
      throw new Error('SEVENTEEN_API_KEY is required');
    }

    this.circuitBreaker = CircuitBreakerRegistry.getOrCreate('17track-api', {
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenMaxCalls: 3,
      successThreshold: 2,
    });
  }

  async getquota(): Promise<{
    used: number;
    total: number;
    remaining: number;
  } | null> {
    // Return mock data if no API key is configured
    if (!this.apiKey || this.apiKey === 'your-17track-api-key') {
      logger.warn('[17Track] No API key configured, returning mock quota data');
      return {
        used: 0,
        total: 200,
        remaining: 200,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.baseUrl}/getquota`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '17token': this.apiKey,
        },
        body: JSON.stringify([]),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      logger.log('[17Track] getquota response:', JSON.stringify(data));
      if (data.code === 0 && data.data) {
        return {
          used: data.data.quota_used || 0,
          total: data.data.quota_total || 200,
          remaining: data.data.quota_remain || 0,
        };
      }
      return null;
    } catch (error: any) {
      logger.error('[17Track] getquota failed:', error.message);
      // Return default values on error
      return {
        used: 0,
        total: 200,
        remaining: 200,
      };
    }
  }

  async register(
    trackingNumber: string,
    carrierCode?: string,
    options?: { tag?: string; email?: string; phone?: string },
  ): Promise<RegisterResult> {
    const available = await this.rateLimiter.checkRateLimit('register');
    if (!available) {
      await this.createJob(
        trackingNumber,
        carrierCode || 'unknown',
        'register',
        { tag: options?.tag },
      );
      return {
        trackingNumber,
        carrierCode: carrierCode || '',
        success: false,
        error: 'Rate limited, queued for retry',
      };
    }

    const requestData = [
      {
        number: trackingNumber,
        carrier: carrierCode ? parseInt(carrierCode, 10) : undefined,
        ...(options?.tag && { tag: options.tag }),
        ...(options?.email && { email: options.email }),
        ...(options?.phone && { phone: options.phone }),
      },
    ];

    logger.log(`[17Track] register request: ${JSON.stringify(requestData)}`);

    try {
      // Use circuit breaker for external API call
      const data = await this.circuitBreaker.execute(
        async () => {
          const response = await fetch(`${this.baseUrl}/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              '17token': this.apiKey,
            },
            body: JSON.stringify(requestData),
          });
          return (await response.json()) as RegisterResponse;
        },
        // Fallback when circuit is open
        () => {
          logger.warn('[17Track] Circuit open, using fallback');
          return {
            code: -1,
            data: {
              rejected: [
                {
                  number: trackingNumber,
                  error: {
                    code: -1,
                    message: 'Service temporarily unavailable',
                  },
                },
              ],
            },
          };
        },
      );

      logger.log('[17Track] Register response:', JSON.stringify(data));

      if (data.code !== 0) {
        const error = data.data?.rejected?.[0]?.error || {
          code: data.code,
          message: 'Unknown error',
        };
        logger.warn(`[17Track] Register rejected: ${error.message}`);
        return {
          trackingNumber,
          carrierCode: carrierCode || '',
          success: false,
          error: error.message,
        };
      }

      const accepted = data.data?.accepted?.[0];
      if (!accepted) {
        logger.warn('[17Track] Register no accepted data');
        return {
          trackingNumber,
          carrierCode: carrierCode || '',
          success: false,
          error: 'No accepted response',
        };
      }

      return {
        trackingNumber,
        carrierCode: accepted?.carrier?.toString() || carrierCode || '',
        success: true,
      };
    } catch (error: any) {
      logger.error(
        `[17Track] Register failed for ${trackingNumber}:`,
        error.message,
      );
      return {
        trackingNumber,
        carrierCode: carrierCode || '',
        success: false,
        error: error.message,
      };
    }
  }

  async getTracking(
    trackingNumber: string,
    carrierCode?: string,
  ): Promise<TrackingData | null> {
    const available = await this.rateLimiter.checkRateLimit('gettrackinfo');
    if (!available) {
      await this.createJob(
        trackingNumber,
        carrierCode || 'unknown',
        'gettrackinfo',
      );
      return null;
    }

    const requestData: Array<{ number: string; carrier?: number }> = [];

    if (carrierCode) {
      requestData.push({
        number: trackingNumber,
        carrier: parseInt(carrierCode, 10),
      });
    } else {
      requestData.push({ number: trackingNumber });
    }

    logger.log(`[17Track] getTracking request: ${JSON.stringify(requestData)}`);

    try {
      // Use circuit breaker for external API call
      const data = await this.circuitBreaker.execute(
        async () => {
          const response = await fetch(`${this.baseUrl}/gettrackinfo`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              '17token': this.apiKey,
            },
            body: JSON.stringify(requestData),
          });
          return (await response.json()) as GetTrackacesResponse;
        },
        // Fallback when circuit is open
        () => {
          logger.warn('[17Track] Circuit open, getTracking unavailable');
          return null;
        },
      );

      if (!data) {
        return null;
      }

      logger.log('[17Track] GetTracking response:', JSON.stringify(data));

      if (data.code !== 0 || !data.data?.accepted?.[0]) {
        logger.warn(
          `[17Track] No data for ${trackingNumber}, code: ${data.code}`,
        );
        return null;
      }

      return this.parser.parseTrackingResponse(
        data.data.accepted[0],
        carrierCode,
      );
    } catch (error: any) {
      logger.error(
        `[17Track] GetTracking failed for ${trackingNumber}:`,
        error.message,
      );
      return null;
    }
  }

  async createJob(
    trackingNumber: string,
    carrierCode: string,
    operation: 'register' | 'gettrackinfo' | 'sync',
    metadata?: Record<string, any>,
    priority: number = 0,
  ) {
    const [job] = await db
      .insert(trackingJobs)
      .values({
        shipmentId: metadata?.shipmentId || sql`NULL`,
        trackingNumber,
        carrierCode,
        status: 'pending',
        priority,
        metadata: metadata || null,
        nextAttemptAt: new Date(),
      })
      .returning();

    await db.insert(trackingJobEvents).values({
      jobId: job.id,
      status: 'pending',
      metadata,
    });

    logger.log(
      `Created tracking job ${job.id} for ${trackingNumber} (${operation})`,
    );
    return job;
  }

  async processJob(jobId: string): Promise<boolean> {
    const [job] = await db
      .select()
      .from(trackingJobs)
      .where(eq(trackingJobs.id, jobId));

    if (!job || job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    await db
      .update(trackingJobs)
      .set({
        status: 'processing',
        attempts: job.attempts + 1,
        lastAttemptAt: new Date(),
      })
      .where(eq(trackingJobs.id, jobId));

    try {
      const metadata = (job.metadata as Record<string, any>) || {};
      const operation = metadata.operation || 'gettrackinfo';
      let result: TrackingData | RegisterResult | null = null;

      if (operation === 'register') {
        result = await this.register(
          job.trackingNumber,
          job.carrierCode,
          metadata as any,
        );
      } else {
        result = await this.getTracking(job.trackingNumber, job.carrierCode);
      }

      if (
        (result as any).success === false &&
        (result as any).error?.includes('Rate limited')
      ) {
        await this.scheduleRetry(job, (result as any).error);
        return false;
      }

      await db
        .update(trackingJobs)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(trackingJobs.id, jobId));

      await db.insert(trackingJobEvents).values({
        jobId,
        status: 'completed',
        metadata: result,
      });

      return true;
    } catch (error: any) {
      logger.error(`Job ${jobId} failed:`, error.message);
      await this.scheduleRetry(job, error.message);
      return false;
    }
  }

  private async scheduleRetry(
    job: typeof trackingJobs.$inferSelect,
    error: string,
  ) {
    const maxAttempts = job.maxAttempts || 3;
    const newAttempts = job.attempts + 1;

    if (newAttempts >= maxAttempts) {
      await db
        .update(trackingJobs)
        .set({
          status: 'failed',
          lastError: error,
          nextAttemptAt: null,
        })
        .where(eq(trackingJobs.id, job.id));

      await db.insert(trackingJobEvents).values({
        jobId: job.id,
        status: 'failed',
        error,
      });
    } else {
      const delaySeconds = Math.pow(2, newAttempts) * 30;
      const nextAttempt = new Date(Date.now() + delaySeconds * 1000);

      await db
        .update(trackingJobs)
        .set({
          status: 'retrying',
          lastError: error,
          nextAttemptAt: nextAttempt,
        })
        .where(eq(trackingJobs.id, job.id));

      await db.insert(trackingJobEvents).values({
        jobId: job.id,
        status: 'retrying',
        error,
      });
    }
  }

  async getPendingJobs(limit: number = 50) {
    return db
      .select()
      .from(trackingJobs)
      .where(
        and(
          or(
            eq(trackingJobs.status, 'pending'),
            eq(trackingJobs.status, 'retrying'),
          ),
          sql`${trackingJobs.nextAttemptAt} <= ${new Date()} OR ${trackingJobs.nextAttemptAt} IS NULL`,
        ),
      )
      .orderBy(asc(trackingJobs.priority), asc(trackingJobs.createdAt))
      .limit(limit);
  }

  async getSettings(organisationId?: string) {
    if (organisationId) {
      const [org] = await db
        .select()
        .from(trackingSettings)
        .where(eq(trackingSettings.organisationId, organisationId));
      if (org) return org;
    }
    const all = await db
      .select()
      .from(trackingSettings)
      .where(isNull(trackingSettings.organisationId));
    return all[0] || null;
  }

  async updateSettings(
    organisationId: string | null,
    settings: Partial<typeof trackingSettings.$inferInsert>,
  ) {
    if (organisationId) {
      const [existing] = await db
        .select()
        .from(trackingSettings)
        .where(eq(trackingSettings.organisationId, organisationId));
      if (existing) {
        return db
          .update(trackingSettings)
          .set({ ...settings, updatedAt: new Date() })
          .where(eq(trackingSettings.organisationId, organisationId))
          .returning();
      }
    }
    return db
      .insert(trackingSettings)
      .values({ ...settings, organisationId: organisationId as any })
      .returning();
  }

  async changeInfo(
    items: Array<{
      number: string;
      carrier: number;
      tag?: string;
      email?: string;
      phone?: string;
      lang?: string;
    }>,
  ): Promise<{
    accepted: string[];
    rejected: Array<{ number: string; error: string }>;
  }> {
    if (!items || items.length === 0) {
      return { accepted: [], rejected: [] };
    }

    try {
      const response = await fetch(`${this.baseUrl}/changeinfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '17token': this.apiKey,
        },
        body: JSON.stringify(items),
      });

      const data = await response.json();

      if (data.code !== 0) {
        logger.warn(`[17Track] changeinfo failed, code: ${data.code}`);
        return {
          accepted: [],
          rejected: items.map((i) => ({
            number: i.number,
            error: data.data?.message || 'Unknown error',
          })),
        };
      }

      const accepted = data.data?.accepted?.map((a: any) => a.number) || [];
      const rejected = (data.data?.rejected || []).map((r: any) => ({
        number: r.number,
        error: r.error?.message || 'Unknown error',
      }));

      logger.log(
        `[17Track] changeinfo: ${accepted.length} accepted, ${rejected.length} rejected`,
      );
      return { accepted, rejected };
    } catch (error: any) {
      logger.error(`[17Track] changeinfo failed:`, error.message);
      return {
        accepted: [],
        rejected: items.map((i) => ({
          number: i.number,
          error: error.message,
        })),
      };
    }
  }

  async stopTrack(items: Array<{ number: string; carrier: number }>): Promise<{
    accepted: string[];
    rejected: Array<{ number: string; error: string }>;
  }> {
    if (!items || items.length === 0) {
      return { accepted: [], rejected: [] };
    }

    try {
      const response = await fetch(`${this.baseUrl}/stoptrack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '17token': this.apiKey,
        },
        body: JSON.stringify(items),
      });

      const data = await response.json();

      if (data.code !== 0) {
        logger.warn(`[17Track] stoptrack failed, code: ${data.code}`);
        return {
          accepted: [],
          rejected: items.map((i) => ({
            number: i.number,
            error: data.data?.message || 'Unknown error',
          })),
        };
      }

      const accepted = data.data?.accepted?.map((a: any) => a.number) || [];
      const rejected = (data.data?.rejected || []).map((r: any) => ({
        number: r.number,
        error: r.error?.message || 'Unknown error',
      }));

      logger.log(
        `[17Track] stoptrack: ${accepted.length} accepted, ${rejected.length} rejected`,
      );
      return { accepted, rejected };
    } catch (error: any) {
      logger.error(`[17Track] stoptrack failed:`, error.message);
      return {
        accepted: [],
        rejected: items.map((i) => ({
          number: i.number,
          error: error.message,
        })),
      };
    }
  }

  async retrans(items: Array<{ number: string; carrier: number }>): Promise<{
    accepted: string[];
    rejected: Array<{ number: string; error: string }>;
  }> {
    if (!items || items.length === 0) {
      return { accepted: [], rejected: [] };
    }

    const alreadyAttempted: string[] = [];
    const filteredItems: Array<{ number: string; carrier: number }> = [];

    for (const item of items) {
      const existing = await db
        .select({ count: sql<number>`count(*)` })
        .from(trackingTransLog)
        .where(
          and(
            eq(trackingTransLog.trackingNumber, item.number),
            eq(trackingTransLog.carrierCode, item.carrier.toString()),
          ),
        );

      const count = Number(existing[0]?.count || 0);
      if (count > 0) {
        alreadyAttempted.push(item.number);
      } else {
        filteredItems.push(item);
      }
    }

    if (filteredItems.length === 0) {
      logger.warn(`[17Track] retrans all items already attempted`);
      return {
        accepted: [],
        rejected: items.map((i) => ({
          number: i.number,
          error: 'Re-trans already attempted',
        })),
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/retrack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '17token': this.apiKey,
        },
        body: JSON.stringify(filteredItems),
      });

      const data = await response.json();

      if (data.code !== 0) {
        logger.warn(`[17Track] retrans failed, code: ${data.code}`);
        return {
          accepted: [],
          rejected: items.map((i) => ({
            number: i.number,
            error: data.data?.message || 'Unknown error',
          })),
        };
      }

      const accepted = data.data?.accepted || [];
      const rejected = (data.data?.rejected || []).map((r: any) => ({
        number: r.number,
        error: r.error?.message || 'Unknown error',
      }));

      for (const item of filteredItems) {
        if (accepted.some((a: any) => a.number === item.number)) {
          await db.insert(trackingTransLog).values({
            trackingNumber: item.number,
            carrierCode: item.carrier.toString(),
            metadata: { retransAt: new Date().toISOString() },
          });
        }
      }

      logger.log(
        `[17Track] retrans: ${accepted.length} accepted, ${rejected.length} rejected`,
      );
      return { accepted, rejected };
    } catch (error: any) {
      logger.error(`[17Track] retrans failed:`, error.message);
      return {
        accepted: [],
        rejected: items.map((i) => ({
          number: i.number,
          error: error.message,
        })),
      };
    }
  }

  async changeCarrier(
    items: Array<{ number: string; carrier_old: number; carrier_new: number }>,
  ): Promise<{
    accepted: string[];
    rejected: Array<{ number: string; error: string; attempts_left?: number }>;
  }> {
    if (!items || items.length === 0) {
      return { accepted: [], rejected: [] };
    }

    const MAX_CHANGES = 5;
    const filteredItems: Array<{
      number: string;
      carrier_old: number;
      carrier_new: number;
    }> = [];
    const rejected: Array<{
      number: string;
      error: string;
      attempts_left?: number;
    }> = [];

    for (const item of items) {
      const key = `${item.number}`;
      const existing = await db
        .select({ count: sql<number>`count(*)` })
        .from(trackingTransLog)
        .where(eq(trackingTransLog.trackingNumber, key));

      const count = Number(existing[0]?.count || 0);
      const attemptsLeft = MAX_CHANGES - count;

      if (attemptsLeft <= 0) {
        rejected.push({
          number: item.number,
          error: 'Max carrier changes (5) reached',
          attempts_left: 0,
        });
      } else {
        filteredItems.push(item);
      }
    }

    if (filteredItems.length === 0) {
      logger.warn(`[17Track] changecarrier all items reached limit`);
      return { accepted: [], rejected };
    }

    try {
      const response = await fetch(`${this.baseUrl}/changecarrier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '17token': this.apiKey,
        },
        body: JSON.stringify(filteredItems),
      });

      const data = await response.json();

      if (data.code !== 0) {
        logger.warn(`[17Track] changecarrier failed, code: ${data.code}`);
        return {
          accepted: [],
          rejected: items.map((i) => ({
            number: i.number,
            error: data.data?.message || 'Unknown error',
          })),
        };
      }

      const accepted = data.data?.accepted || [];
      const apiRejected = (data.data?.rejected || []).map((r: any) => ({
        number: r.number,
        error: r.error?.message || 'Unknown error',
      }));

      for (const item of filteredItems) {
        if (accepted.some((a: any) => a.number === item.number)) {
          await db.insert(trackingTransLog).values({
            trackingNumber: item.number,
            carrierCode: `change:${item.carrier_old}->${item.carrier_new}`,
            metadata: {
              changeCarrierAt: new Date().toISOString(),
              newCarrier: item.carrier_new,
            },
          });
        }
      }

      for (const item of filteredItems) {
        if (apiRejected.some((r: any) => r.number === item.number)) {
          const existing = await db
            .select({ count: sql<number>`count(*)` })
            .from(trackingTransLog)
            .where(eq(trackingTransLog.trackingNumber, item.number));
          const remaining = MAX_CHANGES - Number(existing[0]?.count || 0);
          rejected.push({
            number: item.number,
            error:
              apiRejected.find((r: any) => r.number === item.number)?.error ||
              'Failed',
            attempts_left: remaining,
          });
        }
      }

      logger.log(
        `[17Track] changecarrier: ${accepted.length} accepted, ${rejected.length} rejected`,
      );
      return { accepted, rejected };
    } catch (error: any) {
      logger.error(`[17Track] changecarrier failed:`, error.message);
      return {
        accepted: [],
        rejected: items.map((i) => ({
          number: i.number,
          error: error.message,
        })),
      };
    }
  }

  async getChangeCarrierAttempts(
    trackingNumber: string,
  ): Promise<{ attempts: number; attempts_left: number }> {
    const MAX_CHANGES = 5;
    const existing = await db
      .select({ count: sql<number>`count(*)` })
      .from(trackingTransLog)
      .where(
        and(
          eq(trackingTransLog.trackingNumber, trackingNumber),
          sql`${trackingTransLog.carrierCode} LIKE 'change:%'`,
        ),
      );

    const count = Number(existing[0]?.count || 0);
    return { attempts: count, attempts_left: Math.max(0, MAX_CHANGES - count) };
  }
}
